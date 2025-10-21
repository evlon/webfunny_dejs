#!/usr/bin/env node

/**
 * JavaScript 代码智能重命名工具
 * 通过 AST 分析和语义传播实现代码可读性提升
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// ==================== 配置 ====================
const CONFIG = {
  // 语义分类关键词
  semanticKeywords: {
    user: ['user', 'account', 'profile', 'auth'],
    alarm: ['alarm', 'alert', 'notification', 'warning'],
    device: ['device', 'equipment', 'machine', 'hardware'],
    data: ['data', 'info', 'record', 'entry'],
    service: ['service', 'api', 'handler', 'processor'],
    controller: ['controller', 'manager', 'handler']
  },
  
  // 命名约定
  namingConventions: {
    class: 'PascalCase',
    function: 'camelCase',
    variable: 'camelCase',
    constant: 'UPPER_SNAKE_CASE'
  }
};

// ==================== 导出分析器 ====================
class ExportAnalyzer {
  constructor(ast) {
    this.ast = ast;
    this.exports = new Map(); // exportName -> localName
  }

  analyze() {
    traverse(this.ast, {
      // 处理 module.exports = { ... }
      AssignmentExpression: (path) => {
        const { left, right } = path.node;
        
        if (
          t.isMemberExpression(left) &&
          t.isIdentifier(left.object, { name: 'module' }) &&
          t.isIdentifier(left.property, { name: 'exports' }) &&
          t.isObjectExpression(right)
        ) {
          right.properties.forEach(prop => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
              const exportName = prop.key.name;
              const localName = t.isIdentifier(prop.value) 
                ? prop.value.name 
                : exportName;
              this.exports.set(exportName, localName);
            }
          });
        }
        
        // 处理 exports.xxx = yyy
        if (
          t.isMemberExpression(left) &&
          t.isIdentifier(left.object, { name: 'exports' }) &&
          t.isIdentifier(left.property)
        ) {
          const exportName = left.property.name;
          const localName = t.isIdentifier(right) ? right.name : exportName;
          this.exports.set(exportName, localName);
        }
      },
      
      // 处理 ES6 export
      ExportNamedDeclaration: (path) => {
        const { declaration, specifiers } = path.node;
        
        if (declaration) {
          if (t.isVariableDeclaration(declaration)) {
            declaration.declarations.forEach(decl => {
              if (t.isIdentifier(decl.id)) {
                this.exports.set(decl.id.name, decl.id.name);
              }
            });
          } else if (t.isFunctionDeclaration(declaration) && declaration.id) {
            this.exports.set(declaration.id.name, declaration.id.name);
          } else if (t.isClassDeclaration(declaration) && declaration.id) {
            this.exports.set(declaration.id.name, declaration.id.name);
          }
        }
        
        specifiers.forEach(spec => {
          if (t.isExportSpecifier(spec)) {
            this.exports.set(
              spec.exported.name,
              spec.local.name
            );
          }
        });
      },
      
      ExportDefaultDeclaration: (path) => {
        if (t.isIdentifier(path.node.declaration)) {
          this.exports.set('default', path.node.declaration.name);
        }
      }
    });

    return this.exports;
  }
}

// ==================== 作用域分析器 ====================
class ScopeAnalyzer {
  constructor(ast) {
    this.ast = ast;
    this.bindings = new Map(); // name -> bindingInfo[]
  }

  analyze() {
    traverse(this.ast, {
      Program: (path) => {
        this.collectBindings(path.scope);
      },
      FunctionDeclaration: (path) => {
        this.collectBindings(path.scope);
      },
      FunctionExpression: (path) => {
        this.collectBindings(path.scope);
      },
      ArrowFunctionExpression: (path) => {
        this.collectBindings(path.scope);
      },
      ClassMethod: (path) => {
        this.collectBindings(path.scope);
      }
    });

    return this.bindings;
  }

  collectBindings(scope) {
    Object.entries(scope.bindings).forEach(([name, binding]) => {
      if (!this.bindings.has(name)) {
        this.bindings.set(name, []);
      }
      this.bindings.get(name).push({
        scope: scope,
        binding: binding,
        kind: binding.kind,
        path: binding.path
      });
    });

    // 递归处理子作用域
    Object.values(scope.bindings).forEach(binding => {
      if (binding.path.scope !== scope) {
        this.collectBindings(binding.path.scope);
      }
    });
  }
}

// ==================== 语义分析器 ====================
class SemanticAnalyzer {
  constructor(exports) {
    this.exports = exports;
    this.semanticMap = new Map(); // localName -> semanticInfo
  }

  analyze() {
    this.exports.forEach((localName, exportName) => {
      const semantic = this.inferSemantic(exportName);
      this.semanticMap.set(localName, {
        exportName,
        domain: semantic.domain,
        subdomain: semantic.subdomain,
        type: semantic.type,
        confidence: semantic.confidence
      });
    });

    return this.semanticMap;
  }

  inferSemantic(name) {
    const lowerName = name.toLowerCase();
    
    // 识别类型
    let type = 'variable';
    if (name.endsWith('Controller')) type = 'controller';
    else if (name.endsWith('Service')) type = 'service';
    else if (name.endsWith('Manager')) type = 'manager';
    else if (name.endsWith('Handler')) type = 'handler';
    else if (name[0] === name[0].toUpperCase()) type = 'class';

    // 识别领域
    let domain = 'general';
    let subdomain = '';
    let confidence = 0.5;

    for (const [key, keywords] of Object.entries(CONFIG.semanticKeywords)) {
      for (const keyword of keywords) {
        if (lowerName.includes(keyword)) {
          domain = key;
          subdomain = keyword;
          confidence = 0.8;
          break;
        }
      }
      if (confidence > 0.5) break;
    }

    return { domain, subdomain, type, confidence };
  }
}

// ==================== 重命名引擎 ====================
class RenameEngine {
  constructor(ast, exports, semanticMap, bindings) {
    this.ast = ast;
    this.exports = exports;
    this.semanticMap = semanticMap;
    this.bindings = bindings;
    this.renameMap = new Map(); // oldName -> newName
    this.usedNames = new Set();
  }

  generateRenames() {
    // 首先重命名导出项
    this.exports.forEach((localName, exportName) => {
      if (localName !== exportName) {
        this.renameMap.set(localName, exportName);
        this.usedNames.add(exportName);
      }
    });

    // 传播语义到相关标识符
    this.propagateSemantics();

    return this.renameMap;
  }

  propagateSemantics() {
    traverse(this.ast, {
      VariableDeclarator: (path) => {
        const { id, init } = path.node;
        
        if (t.isIdentifier(id) && init) {
          // 如果初始化值是已重命名的标识符
          if (t.isIdentifier(init) && this.renameMap.has(init.name)) {
            const baseName = this.renameMap.get(init.name);
            const newName = this.generateDerivedName(baseName, 'instance');
            if (newName && !this.renameMap.has(id.name)) {
              this.renameMap.set(id.name, newName);
              this.usedNames.add(newName);
            }
          }
          
          // 如果是 new Expression
          if (t.isNewExpression(init) && t.isIdentifier(init.callee)) {
            const className = init.callee.name;
            if (this.renameMap.has(className)) {
              const baseName = this.renameMap.get(className);
              const newName = this.generateDerivedName(baseName, 'instance');
              if (newName && !this.renameMap.has(id.name)) {
                this.renameMap.set(id.name, newName);
                this.usedNames.add(newName);
              }
            }
          }
        }
      },

      FunctionDeclaration: (path) => {
        if (path.node.id && !this.renameMap.has(path.node.id.name)) {
          const semantic = this.semanticMap.get(path.node.id.name);
          if (semantic) {
            const newName = this.generateFunctionName(semantic);
            if (newName) {
              this.renameMap.set(path.node.id.name, newName);
              this.usedNames.add(newName);
            }
          }
        }
        
        // 重命名参数
        this.renameParameters(path.node.params);
      },

      ClassMethod: (path) => {
        if (t.isIdentifier(path.node.key) && !this.renameMap.has(path.node.key.name)) {
          const methodName = path.node.key.name;
          const newName = this.generateMethodName(methodName, path);
          if (newName && newName !== methodName) {
            this.renameMap.set(methodName, newName);
            this.usedNames.add(newName);
          }
        }
        
        // 重命名参数
        this.renameParameters(path.node.params);
      }
    });
  }

  renameParameters(params) {
    params.forEach((param, index) => {
      if (t.isIdentifier(param) && !this.renameMap.has(param.name)) {
        // 简单的参数重命名策略
        if (param.name.length === 1) {
          const commonParamNames = ['data', 'item', 'value', 'obj', 'config', 'options'];
          const newName = commonParamNames[index % commonParamNames.length];
          if (!this.usedNames.has(newName)) {
            this.renameMap.set(param.name, newName);
            this.usedNames.add(newName);
          }
        }
      }
    });
  }

  generateDerivedName(baseName, suffix) {
    const newName = baseName.charAt(0).toLowerCase() + baseName.slice(1).replace(/Controller$|Service$|Manager$/, '');
    return this.ensureUnique(newName + this.capitalize(suffix));
  }

  generateFunctionName(semantic) {
    if (semantic.subdomain) {
      const parts = semantic.subdomain.split(/(?=[A-Z])/);
      return this.toCamelCase(parts);
    }
    return null;
  }

  generateMethodName(name, path) {
    // 基于常见模式识别
    const patterns = {
      'get': /^(get|fetch|retrieve|load)/i,
      'set': /^(set|update|modify|change)/i,
      'create': /^(create|add|insert|new)/i,
      'delete': /^(delete|remove|destroy)/i,
      'check': /^(check|verify|validate|test)/i,
      'handle': /^(handle|process|execute)/i
    };

    for (const [action, pattern] of Object.entries(patterns)) {
      if (pattern.test(name)) {
        return name; // 保持有意义的名称
      }
    }

    return null;
  }

  toCamelCase(parts) {
    return parts.map((p, i) => 
      i === 0 ? p.toLowerCase() : this.capitalize(p)
    ).join('');
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  ensureUnique(name) {
    if (!this.usedNames.has(name)) {
      return name;
    }
    
    let counter = 1;
    let uniqueName = `${name}${counter}`;
    while (this.usedNames.has(uniqueName)) {
      counter++;
      uniqueName = `${name}${counter}`;
    }
    return uniqueName;
  }
}

// ==================== 代码转换器 ====================
class CodeTransformer {
  constructor(ast, renameMap) {
    this.ast = ast;
    this.renameMap = renameMap;
  }

  transform() {
    traverse(this.ast, {
      Identifier: (path) => {
        const oldName = path.node.name;
        
        // 跳过对象属性键（除非是简写属性）
        if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node && !path.parent.shorthand) {
          return;
        }
        
        // 跳过成员表达式的属性部分（除非是计算属性）
        if (path.parent.type === 'MemberExpression' && path.parent.property === path.node && !path.parent.computed) {
          return;
        }

        if (this.renameMap.has(oldName)) {
          const newName = this.renameMap.get(oldName);
          
          // 检查绑定确保不会造成冲突
          const binding = path.scope.getBinding(oldName);
          if (binding && binding.identifier === path.node) {
            // 这是定义位置
            path.node.name = newName;
          } else if (binding || path.scope.hasGlobal(oldName)) {
            // 这是引用位置
            path.node.name = newName;
          }
        }
      }
    });

    return this.ast;
  }
}

// ==================== 主程序 ====================
class JSRenamer {
  constructor(filePath) {
    this.filePath = filePath;
    this.sourceCode = '';
    this.ast = null;
    this.exports = null;
    this.semanticMap = null;
    this.renameMap = null;
  }

  async run() {
    try {
      console.log(`\n开始分析文件: ${path.basename(this.filePath)}`);
      
      // 1. 读取源代码
      this.sourceCode = fs.readFileSync(this.filePath, 'utf-8');
      fs.writeFileSync(this.filePath + ".ren.bak", this.sourceCode, 'utf-8');

      // 2. 解析 AST
      this.ast = parser.parse(this.sourceCode, {
        sourceType: 'module',
        plugins: ['jsx']
      });
      
      // 3. 分析导出
      const exportAnalyzer = new ExportAnalyzer(this.ast);
      this.exports = exportAnalyzer.analyze();
      
      console.log('\n发现导出项:');
      this.exports.forEach((localName, exportName) => {
        console.log(`  ${exportName} -> ${localName}`);
      });
      
      // 4. 语义分析
      const semanticAnalyzer = new SemanticAnalyzer(this.exports);
      this.semanticMap = semanticAnalyzer.analyze();
      
      // 5. 作用域分析
      const scopeAnalyzer = new ScopeAnalyzer(this.ast);
      const bindings = scopeAnalyzer.analyze();
      
      // 6. 生成重命名映射
      const renameEngine = new RenameEngine(this.ast, this.exports, this.semanticMap, bindings);
      this.renameMap = renameEngine.generateRenames();
      
      // 7. 应用重命名
      const transformer = new CodeTransformer(this.ast, this.renameMap);
      const transformedAst = transformer.transform();
      
      // 8. 生成代码
      const output = generate(transformedAst, {
        retainLines: false,
        compact: false,
        comments: true
      });
      
      // 9. 写入文件

      // const outputPath = this.filePath.replace(/\.js$/, '_renamed.js');
      const outputPath = this.filePath;
      fs.writeFileSync(outputPath, output.code, 'utf-8');
      
      // 10. 输出报告
      console.log('\n重命名完成!');
      console.log(`新文件已生成: ${path.basename(outputPath)}`);
      this.printReport();
      
    } catch (error) {
      console.error('\n错误:', error.message);
      if (error.loc) {
        console.error(`位置: 行 ${error.loc.line}, 列 ${error.loc.column}`);
      }
      process.exit(1);
    }
  }

  printReport() {
    console.log('\n重命名报告:');
    console.log('='.repeat(50));
    
    const renames = Array.from(this.renameMap.entries())
      .filter(([old, newName]) => old !== newName);
    
    renames.forEach(([oldName, newName]) => {
      console.log(`  ${oldName.padEnd(20)} -> ${newName}`);
    });
    
    console.log('='.repeat(50));
    console.log(`总计重命名: ${renames.length} 个标识符\n`);
  }
}

// ==================== 命令行入口 ====================
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\nJS 代码重命名工具');
    console.log('用法: node rename.js <target-file>');
    console.log('\n示例: node rename.js ./src/controllers.js\n');
    process.exit(0);
  }

  const targetFile = args[0];
  
  if (!fs.existsSync(targetFile)) {
    console.error(`\n错误: 文件不存在: ${targetFile}\n`);
    process.exit(1);
  }

  const renamer = new JSRenamer(targetFile);
  renamer.run();
}

// 运行主程序
if (require.main === module) {
  main();
}

module.exports = { JSRenamer, ExportAnalyzer, SemanticAnalyzer, RenameEngine };