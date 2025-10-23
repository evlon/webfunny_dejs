#!/usr/bin/env node

/**
 * 加密脚本拆分工具 - 依赖链保留策略
 * 策略：
 * 1. 复制原文件所有全局内容到每个子模块
 * 2. 添加子模块间的依赖引用
 * 3. 只删除确认不需要的其他类定义
 * 4. 保留完整的依赖链（如果A被保留且A依赖B，则B也必须保留）
 * 
 * 原则：宁可保留不需要的代码，也不能遗漏需要的代码
 */

const fs = require('fs');
const path = require('path');
const { parseCode, traverse, generate } = require('./lib/ast-utils');

/**
 * 分析控制器脚本结构
 */
function analyzeControllerScript(targetFile) {
  console.log(`\n📖 分析控制器脚本: ${targetFile}`);
  
  const code = fs.readFileSync(targetFile, 'utf8');
  const ast = parseCode(code);
  
  const controllers = new Map();
  const exports = new Map();
  const globalStatements = []; // 所有非类定义的全局语句
  
  // 遍历 AST，收集类定义和全局语句
  ast.program.body.forEach((node, index) => {
    if (node.type === 'ClassDeclaration') {
      const className = node.id?.name;
      if (className) {
        controllers.set(className, {
          name: className,
          node: node,
          code: generate(node).code,
          index: index,
          isExported: false,
          exportName: className
        });
        console.log(`  ✓ 找到类 [${index}]: ${className}`);
      }
    } else {
      // 保存所有非类定义的语句
      globalStatements.push({
        node: node,
        code: generate(node).code,
        index: index,
        type: node.type
      });
    }
  });
  
  console.log(`  📊 全局语句数量: ${globalStatements.length}`);
  
  // 分析导出
  traverse(ast, {
    AssignmentExpression(path) {
      if (path.node.left.type === 'MemberExpression' &&
          path.node.left.object?.name === 'module' &&
          path.node.left.property?.name === 'exports' &&
          path.node.right.type === 'ObjectExpression') {
        
        path.node.right.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            const keyName = prop.key.name;
            const valueName = prop.value.name;
            
            if (keyName && valueName) {
              exports.set(keyName, valueName);
              
              if (controllers.has(valueName)) {
                const ctrl = controllers.get(valueName);
                ctrl.isExported = true;
                ctrl.exportName = keyName;
              }
            }
          }
        });
      }
    }
  });
  
  console.log(`  ✅ 分析完成: ${controllers.size} 个类, ${exports.size} 个导出\n`);
  
  return { 
    controllers, 
    exports, 
    globalStatements,
    ast, 
    code 
  };
}

/**
 * 提取语句中声明的标识符（变量名、函数名等）
 */
function extractDeclaredIdentifiers(statement) {
  const identifiers = new Set();
  
  try {
    if (statement.type === 'VariableDeclaration') {
      statement.node.declarations.forEach(decl => {
        if (decl.id.type === 'Identifier') {
          identifiers.add(decl.id.name);
        } else if (decl.id.type === 'ObjectPattern') {
          // 解构赋值：const { a, b } = ...
          decl.id.properties.forEach(prop => {
            if (prop.type === 'ObjectProperty' && prop.key?.name) {
              identifiers.add(prop.key.name);
            } else if (prop.type === 'RestElement' && prop.argument?.name) {
              identifiers.add(prop.argument.name);
            }
          });
        } else if (decl.id.type === 'ArrayPattern') {
          // 数组解构：const [a, b] = ...
          decl.id.elements.forEach(elem => {
            if (elem && elem.type === 'Identifier') {
              identifiers.add(elem.name);
            }
          });
        }
      });
    } else if (statement.type === 'FunctionDeclaration' && statement.node.id) {
      identifiers.add(statement.node.id.name);
    } else if (statement.type === 'ClassDeclaration' && statement.node.id) {
      identifiers.add(statement.node.id.name);
    }
  } catch (error) {
    console.warn(`  ⚠️  提取标识符失败: ${error.message}`);
  }
  
  return identifiers;
}

/**
 * 提取语句中使用的标识符（依赖的变量、函数等）
 */
function extractUsedIdentifiers(statement) {
  const identifiers = new Set();
  
  try {
    const ast = parseCode(statement.code);
    const declaredInStatement = extractDeclaredIdentifiers(statement);
    
    traverse(ast, {
      Identifier(path) {
        const name = path.node.name;
        
        // 跳过声明自身
        if (declaredInStatement.has(name)) {
          return;
        }
        
        // 跳过内部作用域的绑定
        if (path.scope.hasBinding(name)) {
          return;
        }
        
        // 跳过某些特殊标识符
        if (['undefined', 'null', 'true', 'false', 'NaN', 'Infinity'].includes(name)) {
          return;
        }
        
        // 跳过全局对象和常见内置对象
        if (['console', 'process', 'global', 'window', 'document', 
             'Array', 'Object', 'String', 'Number', 'Boolean', 'Math',
             'JSON', 'Date', 'RegExp', 'Error', 'Promise'].includes(name)) {
          return;
        }
        
        identifiers.add(name);
      },
      
      MemberExpression(path) {
        // 对于 a.b.c，只记录 a
        if (path.node.object.type === 'Identifier') {
          const name = path.node.object.name;
          if (!path.scope.hasBinding(name)) {
            identifiers.add(name);
          }
        }
      }
    });
  } catch (error) {
    console.warn(`  ⚠️  提取使用的标识符失败: ${error.message}`);
  }
  
  return identifiers;
}

/**
 * 构建语句依赖图
 */
function buildStatementDependencyGraph(globalStatements) {
  const graph = new Map(); // 语句索引 -> { declares: Set, uses: Set }
  
  globalStatements.forEach((statement, index) => {
    const declares = extractDeclaredIdentifiers(statement);
    const uses = extractUsedIdentifiers(statement);
    
    graph.set(index, {
      statement: statement,
      declares: declares,
      uses: uses
    });
  });
  
  return graph;
}

/**
 * 检测类中引用的其他控制器
 */
function detectControllerReferences(classCode, allControllerNames, currentClassName) {
  const references = new Set();
  
  try {
    const ast = parseCode(classCode);
    
    traverse(ast, {
      Identifier(path) {
        const name = path.node.name;
        
        if (allControllerNames.has(name) && name !== currentClassName) {
          // 确保不是在声明位置
          const parent = path.parent;
          if (parent.type !== 'FunctionDeclaration' &&
              parent.type !== 'VariableDeclarator' &&
              parent.type !== 'ClassDeclaration') {
            references.add(name);
          }
        }
      },
      
      NewExpression(path) {
        const callee = path.node.callee;
        if (callee.type === 'Identifier' && 
            allControllerNames.has(callee.name) &&
            callee.name !== currentClassName) {
          references.add(callee.name);
        }
      }
    });
  } catch (error) {
    console.warn(`  ⚠️  检测引用失败: ${error.message}`);
  }
  
  return references;
}

/**
 * 计算需要保留的语句（包含完整依赖链）
 */
function calculateRequiredStatements(classCode, globalStatements, allControllerNames) {
  console.log(`  🔍 分析依赖链...`);
  
  // 构建依赖图
  const dependencyGraph = buildStatementDependencyGraph(globalStatements);
  
  // 步骤1: 找出类直接使用的标识符
  const classUsedIdentifiers = extractUsedIdentifiers({
    code: classCode,
    type: 'ClassDeclaration',
    node: null
  });
  
  console.log(`  📌 类直接使用的标识符 (${classUsedIdentifiers.size}): ${Array.from(classUsedIdentifiers).slice(0, 10).join(', ')}${classUsedIdentifiers.size > 10 ? '...' : ''}`);
  
  // 步骤2: 从类使用的标识符开始，追踪依赖链
  const requiredStatements = new Set();
  const toProcess = new Set(classUsedIdentifiers);
  const processed = new Set();
  
  while (toProcess.size > 0) {
    const identifier = toProcess.values().next().value;
    toProcess.delete(identifier);
    
    if (processed.has(identifier)) {
      continue;
    }
    processed.add(identifier);
    
    // 找到声明这个标识符的语句
    dependencyGraph.forEach((info, index) => {
      if (info.declares.has(identifier)) {
        // 标记这个语句需要保留
        requiredStatements.add(index);
        
        // 将这个语句使用的标识符加入待处理队列
        info.uses.forEach(usedId => {
          if (!processed.has(usedId)) {
            toProcess.add(usedId);
          }
        });
      }
    });
  }
  
  console.log(`  ✓ 需要保留 ${requiredStatements.size}/${globalStatements.length} 个语句（包含完整依赖链）`);
  
  return requiredStatements;
}

/**
 * 生成控制器模块 - 依赖链保留策略
 */
function generateControllerModule(controllerInfo, analysis) {
  const { name, code } = controllerInfo;
  const { globalStatements, controllers } = analysis;
  
  console.log(`\n📝 生成模块: ${name}`);
  
  const allControllerNames = new Set(controllers.keys());
  
  // 1. 检测这个类引用了哪些其他控制器
  const referencedControllers = detectControllerReferences(
    code, 
    allControllerNames, 
    name
  );
  
  if (referencedControllers.size > 0) {
    console.log(`  🔗 引用的控制器: ${Array.from(referencedControllers).join(', ')}`);
  }
  
  // 2. 计算需要保留的语句（包含完整依赖链）
  const requiredStatements = calculateRequiredStatements(
    code, 
    globalStatements, 
    allControllerNames
  );
  
  // 3. 生成模块头部
  let content = `/**
 * ${name} 控制器模块
 * 自动生成于: ${new Date().toISOString()}
 * 策略: 依赖链完整保留
 */

`;
  
  // 4. 按原始顺序添加需要的语句
  let addedCount = 0;
  globalStatements.forEach((statement, index) => {
    // 跳过 module.exports 语句
    if (statement.type === 'ExpressionStatement' &&
        statement.node.expression?.type === 'AssignmentExpression' &&
        statement.node.expression.left?.type === 'MemberExpression' &&
        statement.node.expression.left.object?.name === 'module' &&
        statement.node.expression.left.property?.name === 'exports') {
      return;
    }
    
    // 只保留必需的语句
    if (requiredStatements.has(index)) {
      content += `${statement.code}\n`;
      addedCount++;
    }
  });
  
  console.log(`  ✅ 添加了 ${addedCount} 个语句`);
  
  if (addedCount > 0) {
    content += '\n';
  }
  
  // 5. 添加子模块间的引用
  if (referencedControllers.size > 0) {
    content += '// 子模块引用\n';
    referencedControllers.forEach(refName => {

      // 首字母小写
      const modulePath = refName.replace(/^\w/,(str)=>str.toLowerCase());

      // const modulePath = `./${refName.toLowerCase()}`;
      content += `const ${refName} = require('${modulePath}').${refName};\n`;
    });
    content += '\n';
  }
  
  // 6. 添加当前类的定义
  content += `// ${name} 控制器类\n`;
  content += `${code}\n\n`;
  
  // 7. 导出
  content += `module.exports = { ${name} };\n`;
  
  return content;
}

/**
 * 生成主入口文件
 */
function generateMainEntryFile(splitModules, originalFile) {
  let content = `/**
 * 主入口文件
 * 原始文件: ${path.basename(originalFile)}
 * 生成时间: ${new Date().toISOString()}
 */

`;
  
  // 引入所有模块
  splitModules.forEach(moduleInfo => {
    const modulePath = `./${moduleInfo.fileName.replace('.js', '')}`;
    content += `const ${moduleInfo.moduleName} = require('${modulePath}');\n`;
  });
  
  content += '\n// 导出所有控制器\nmodule.exports = {\n';
  
  splitModules.forEach(moduleInfo => {
    if (moduleInfo.isExported) {
      content += `  ${moduleInfo.exportName}: ${moduleInfo.moduleName}.${moduleInfo.className},\n`;
    }
  });
  
  content += '};\n';
  
  return content;
}

/**
 * 主拆分函数
 */
function splitControllerScript(targetFile, outputDir, options = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 控制器脚本拆分工具 - 依赖链完整保留策略`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  📂 源文件: ${targetFile}`);
  console.log(`  📁 输出目录: ${outputDir}`);
  console.log(`  🎯 策略: 追踪完整依赖链，确保零遗漏`);
  console.log(`${'='.repeat(60)}\n`);
  
  const { backup = true } = options;
  
  try {
    // 创建备份
    if (backup) {
      const backupFile = `${targetFile}.bak`;
      if (!fs.existsSync(backupFile)) {
        fs.copyFileSync(targetFile, backupFile);
        console.log(`💾 创建备份: ${backupFile}\n`);
      }
    }
    
    // 分析脚本
    const analysis = analyzeControllerScript(targetFile);
    const { controllers } = analysis;
    
    if (controllers.size === 0) {
      throw new Error('未找到任何控制器类');
    }
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 生成所有模块
    const splitModules = [];
    
    controllers.forEach((controllerInfo, className) => {
      const fileName = `${className.replace(/^\w/,(str)=>str.toLowerCase())}.js`;
      const content = generateControllerModule(controllerInfo, analysis);
      
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, content, 'utf8');
      
      splitModules.push({
        className,
        moduleName: className.replace(/^\w/,(str)=>str.toLowerCase()),
        fileName,
        exportName: controllerInfo.exportName,
        isExported: controllerInfo.isExported
      });
      
      console.log(`  ✅ 已保存: ${fileName}`);
    });
    
    // 生成主入口
    const mainContent = generateMainEntryFile(splitModules, targetFile);
    const mainPath = path.join(outputDir, path.basename(targetFile));
    fs.writeFileSync(mainPath, mainContent, 'utf8');
    
    console.log(`\n  ✅ 已保存主入口: ${path.basename(targetFile)}`);
    
    // 输出统计信息
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 拆分完成！`);
    console.log(`${'='.repeat(60)}`);
    console.log(`  📊 控制器数量: ${splitModules.length}`);
    console.log(`  📦 生成文件数: ${splitModules.length + 1}`);
    console.log(`  📂 输出目录: ${outputDir}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // 列出所有生成的文件
    console.log(`📋 生成的文件列表:`);
    console.log(`  ├─ ${path.basename(targetFile)} (主入口)`);
    splitModules.forEach((mod, index) => {
      const isLast = index === splitModules.length - 1;
      const prefix = isLast ? '  └─' : '  ├─';
      console.log(`${prefix} ${mod.fileName} (${mod.className})`);
    });
    console.log();
    
    return {
      splitModules,
      mainEntryFile: mainPath,
      modulesDir: outputDir
    };
    
  } catch (error) {
    console.error(`\n❌ 拆分失败: ${error.message}`);
    console.error(`\n堆栈信息:\n${error.stack}\n`);
    throw error;
  }
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║      控制器脚本拆分工具 - 依赖链完整保留策略               ║
╚═══════════════════════════════════════════════════════════╝

用法: node split.js <目标文件> [输出目录] [选项]

参数:
  <目标文件>     要拆分的 JavaScript 文件
  [输出目录]     输出目录（默认为源文件所在目录）

选项:
  --no-backup   不创建备份文件

示例:
  node split.js controllers.js
  node split.js controllers.js ./output
  node split.js controllers.js ./output --no-backup

核心特点:
  ✓ 保留完整的依赖链（A依赖B，B依赖C，全部保留）
  ✓ 保持原始顺序和格式
  ✓ 支持任何复杂的 JS 语法
  ✓ 自动处理子模块间引用
  ✓ 宁可冗余，绝不遗漏

工作原理:
  1. 分析类直接使用的标识符
  2. 追踪这些标识符的声明语句
  3. 递归追踪声明语句依赖的标识符
  4. 保留整条依赖链上的所有语句
    `);
    process.exit(1);
  }
  
  const targetFile = args[0];
  const outputDir = args[1] || path.dirname(targetFile);
  const noBackup = args.includes('--no-backup');
  
  try {
    splitControllerScript(targetFile, outputDir, { backup: !noBackup });
  } catch (error) {
    process.exit(1);
  }
}

module.exports = {
  splitControllerScript,
  analyzeControllerScript
};