#!/usr/bin/env node

/**
 * 加密脚本拆分工具 - 完整执行环境版本
 * 确保每个拆分后的模块都能独立执行，包含完整的闭包环境
 */

const fs = require('fs');
const path = require('path');

// 复用 lib 目录中的AST工具
const { parseCode, traverse, generate } = require('./lib/ast-utils');

/**
 * 分析目标脚本的控制器类结构
 */
function analyzeControllerScript(targetFile) {
  console.log(`分析控制器脚本: ${targetFile}`);
  
  try {
    const code = fs.readFileSync(targetFile, 'utf8');
    const ast = parseCode(code);
    
    const controllers = new Map(); // 类名 -> 类信息
    const exports = new Map(); // 导出名 -> 类名
    const requiredModules = new Set(); // 依赖模块
    
    console.log('开始AST分析...');
    
    // 分析require语句
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
          if (path.node.arguments.length > 0 && path.node.arguments[0].type === 'StringLiteral') {
            requiredModules.add(path.node.arguments[0].value);
          }
        }
      }
    });
    
    // 收集所有类定义
    let classCount = 0;
    traverse(ast, {
      ClassDeclaration(path) {
        const className = path.node.id?.name;
        if (className) {
          classCount++;
          console.log(`找到类定义 [${classCount}]: ${className}`);
          
          controllers.set(className, {
            name: className,
            node: path.node,
            code: generate(path.node).code,
            startLine: path.node.loc?.start.line,
            endLine: path.node.loc?.end.line,
            isExported: false,
            exportName: className
          });
        }
      }
    });
    
    // 分析导出结构
    let exportFound = false;
    traverse(ast, {
      AssignmentExpression(path) {
        // 处理 module.exports = { ... }
        if (path.node.left.type === 'MemberExpression' &&
            path.node.left.object?.name === 'module' &&
            path.node.left.property?.name === 'exports') {
          
          exportFound = true;
          console.log('找到module.exports赋值语句');
          
          if (path.node.right.type === 'ObjectExpression') {
            console.log('找到ObjectExpression导出对象');
            
            path.node.right.properties.forEach((prop, index) => {
              console.log(`处理导出属性 [${index}]:`, prop.type);
              
              if (prop.type === 'ObjectProperty') {
                let keyName = '';
                let valueName = '';
                
                // 获取键名
                if (prop.key.type === 'Identifier') {
                  keyName = prop.key.name;
                }
                
                // 获取值名
                if (prop.value.type === 'Identifier') {
                  valueName = prop.value.name;
                }
                
                if (keyName && valueName) {
                  exports.set(keyName, valueName);
                  console.log(`导出映射: ${keyName} -> ${valueName}`);
                  
                  // 标记这个类被导出了
                  if (controllers.has(valueName)) {
                    controllers.get(valueName).isExported = true;
                    controllers.get(valueName).exportName = keyName;
                    console.log(`标记类 ${valueName} 为已导出，导出名: ${keyName}`);
                  }
                }
              }
            });
          }
        }
      }
    });
    
    if (!exportFound) {
      console.log('警告: 未找到module.exports语句');
    }
    
    console.log(`AST分析完成: 找到 ${controllers.size} 个类，${exports.size} 个导出项`);
    
    return {
      controllers,
      exports,
      requiredModules,
      ast,
      code
    };
    
  } catch (error) {
    console.error(`分析控制器脚本失败: ${error.message}`);
    throw error;
  }
}

/**
 * 提取原始文件中的全局依赖（require语句、变量声明等），包括子模块间引用
 */
function extractGlobalDependencies(originalCode, targetFile, allControllers) {
  const ast = parseCode(originalCode);
  const dependencies = new Map(); // 变量名 -> 依赖内容
  const variableAssignments = new Map(); // 变量名 -> 赋值内容
  
  // 收集所有控制器类名，用于检测子模块间引用
  const controllerNames = new Set(allControllers ? allControllers.keys() : []);
  
  // 第一遍：收集所有变量声明和赋值
  ast.program.body.forEach(node => {
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach(decl => {
        if (decl.id.type === 'Identifier') {
          const varName = decl.id.name;
          
          // 处理require语句
          if (decl.init && 
              decl.init.type === 'CallExpression' && 
              decl.init.callee.type === 'Identifier' && 
              decl.init.callee.name === 'require') {
            
            let requirePath = decl.init.arguments[0].value;
            
            // 修正相对路径：当模块被移动到 sub-modules 目录时，需要调整相对路径
            if (requirePath.startsWith('./') || requirePath.startsWith('../')) {
              requirePath = path.join('../', requirePath);
            }
            
            dependencies.set(varName, {
              type: 'require',
              code: `const ${varName} = require('${requirePath}');`,
              varName: varName,
              requirePath: requirePath
            });
          } else {
            // 记录其他类型的变量赋值
            variableAssignments.set(varName, {
              node: decl,
              init: decl.init
            });
          }
        } else if (decl.id.type === 'ObjectPattern') {
          // 处理解构赋值
          if (decl.init && decl.init.type === 'CallExpression' && 
              decl.init.callee.type === 'Identifier' && 
              decl.init.callee.name === 'require') {
            
            // 直接解构：const { readFile, writeFile } = require('fs')
            let requirePath = decl.init.arguments[0].value;
            const variables = [];
            
            // 收集所有解构的变量名
            decl.id.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                const varName = prop.key.name;
                variables.push(varName);
              }
            });
            
            if (variables.length > 0) {
              // 修正相对路径
              if (requirePath.startsWith('./') || requirePath.startsWith('../')) {
                requirePath = path.join('../', requirePath);
              }
              
              // 为整个解构赋值生成一个依赖项
              const depName = `destructured_${variables.join('_')}`;
              
              // 生成修正后的代码
              const variableList = variables.join(', ');
              const correctedCode = `const { ${variableList} } = require('${requirePath}');`;
              
              dependencies.set(depName, {
                type: 'require_destructured',
                code: correctedCode,
                varName: depName,
                requirePath: requirePath,
                variables: variables
              });
              
              // 同时为每个变量创建映射
              variables.forEach(varName => {
                dependencies.set(varName, {
                  type: 'variable_from_destructured',
                  sourceDep: depName,
                  varName: varName
                });
              });
            }
          } else {
            // 处理间接解构赋值：const { a, b } = someVariable
            const targetVar = decl.init && decl.init.type === 'Identifier' ? decl.init.name : null;
            const variables = [];
            
            decl.id.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
                const varName = prop.key.name;
                variables.push(varName);
              }
            });
            
            if (targetVar && variables.length > 0) {
              // 为整个间接解构赋值创建一个特殊的依赖项
              const depName = `indirect_destructured_${targetVar}_${variables.join('_')}`;
              
              dependencies.set(depName, {
                type: 'indirect_destructured',
                code: `const { ${variables.join(', ')} } = ${targetVar};`,
                varName: depName,
                sourceVar: targetVar,
                variables: variables
              });
              
              // 为每个变量创建映射
              variables.forEach(varName => {
                dependencies.set(varName, {
                  type: 'variable_from_indirect_destructured',
                  sourceDep: depName,
                  varName: varName
                });
              });
            }
          }
        }
      });
    }
  });
  
  // 第二遍：检测子模块间引用（控制器类间的相互引用）
  if (allControllers && controllerNames.size > 1) {
    // 遍历整个 AST 来检测子模块间引用
    traverse(ast, {
      ClassDeclaration(path) {
        const className = path.node.id?.name;
        if (className && controllerNames.has(className)) {
          // 在类内部查找对其他控制器的引用
          path.traverse({
            NewExpression(newPath) {
              const callee = newPath.node.callee;
              if (callee.type === 'Identifier' && controllerNames.has(callee.name)) {
                // 检测到 new OtherController() 这种引用
                const refControllerName = callee.name;
                if (refControllerName !== className) {
                  console.log(`[INFO] 检测到控制器引用: ${className} -> ${refControllerName} (NewExpression)`);
                  // 创建子模块间引用依赖
                  const depName = `controller_ref_${className}_to_${refControllerName}`;
                  const modulePath = `../sub-modules/${refControllerName.toLowerCase()}`;
                  
                  dependencies.set(depName, {
                    type: 'controller_reference',
                    code: `const ${refControllerName} = require('${modulePath}').${refControllerName};`,
                    varName: refControllerName,
                    sourceController: refControllerName,
                    targetController: className
                  });
                  
                  // 同时为控制器名称创建直接映射
                  dependencies.set(refControllerName, {
                    type: 'controller_reference',
                    code: `const ${refControllerName} = require('${modulePath}').${refControllerName};`,
                    varName: refControllerName,
                    sourceController: refControllerName,
                    targetController: className
                  });
                }
              }
            },
            
            MemberExpression(memberPath) {
              const object = memberPath.node.object;
              const property = memberPath.node.property;
              
              // 检测 this.otherController.method() 这种引用
              if (object.type === 'ThisExpression' && 
                  property.type === 'Identifier' && 
                  controllerNames.has(property.name)) {
                const refControllerName = property.name;
                if (refControllerName !== className) {
                  console.log(`[INFO] 检测到控制器属性引用: ${className} -> ${refControllerName} (MemberExpression)`);
                  // 创建子模块间引用依赖
                  const depName = `controller_property_ref_${className}_to_${refControllerName}`;
                  const modulePath = `../sub-modules/${refControllerName.toLowerCase()}`;
                  
                  dependencies.set(depName, {
                    type: 'controller_property_reference',
                    code: `const ${refControllerName} = require('${modulePath}').${refControllerName};`,
                    varName: refControllerName,
                    sourceController: refControllerName,
                    targetController: className
                  });
                  
                  // 同时为控制器名称创建直接映射
                  dependencies.set(refControllerName, {
                    type: 'controller_property_reference',
                    code: `const ${refControllerName} = require('${modulePath}').${refControllerName};`,
                    varName: refControllerName,
                    sourceController: refControllerName,
                    targetController: className
                  });
                }
              }
              
              // 检测静态方法引用：OtherController.staticMethod()
              if (object.type === 'Identifier' && 
                  controllerNames.has(object.name) &&
                  memberPath.parent.type !== 'NewExpression') {
                const refControllerName = object.name;
                if (refControllerName !== className) {
                  console.log(`[INFO] 检测到静态方法引用: ${className} -> ${refControllerName} (MemberExpression)`);
                  // 创建子模块间引用依赖
                  const depName = `controller_static_ref_${className}_to_${refControllerName}`;
                  const modulePath = `../sub-modules/${refControllerName.toLowerCase()}`;
                  
                  dependencies.set(depName, {
                    type: 'controller_static_reference',
                    code: `const ${refControllerName} = require('${modulePath}').${refControllerName};`,
                    varName: refControllerName,
                    sourceController: refControllerName,
                    targetController: className
                  });
                  
                  // 同时为控制器名称创建直接映射（确保变量名被正确记录）
                  if (!dependencies.has(refControllerName)) {
                    dependencies.set(refControllerName, {
                      type: 'controller_static_reference',
                      code: `const ${refControllerName} = require('${modulePath}').${refControllerName};`,
                      varName: refControllerName,
                      sourceController: refControllerName,
                      targetController: className
                    });
                  }
                }
              }
            }
          });
        }
      }
    });
  }
  
  return dependencies;
}

/**
 * 生成独立的控制器模块（支持子模块间引用）
 */
function generateControllerModule(controllerInfo, allRequiredModules, targetFile, originalCode, allControllers) {
  const { name, code } = controllerInfo;
  
  let content = `/**
 * ${name} 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

`;
  
  // 计算基础路径：目标文件所在目录
  const targetDir = path.dirname(targetFile);
  
  // 分析原始文件中的全局依赖，包括子模块间引用
  const globalDependencies = extractGlobalDependencies(originalCode, targetFile, allControllers);
  
  // 分析控制器代码中实际使用的依赖
  const controllerAst = parseCode(code);
  const usedVariables = new Set(); // 记录使用的变量名
  const usedDependencies = new Set(); // 记录使用的依赖项
  const missingDependencies = new Set(); // 记录需要但未找到的依赖
  
  traverse(controllerAst, {
    Identifier(path) {
      const node = path.node;
      const parent = path.parent;
      
      // 跳过函数声明和变量声明中的标识符
      if (parent.type === 'FunctionDeclaration' || 
          parent.type === 'VariableDeclarator' ||
          parent.type === 'ClassDeclaration' ||
          parent.type === 'MethodDefinition') {
        return;
      }
      
      // 检测标识符引用
      if (globalDependencies.has(node.name)) {
        const dep = globalDependencies.get(node.name);
        
        // 关键修复：跳过自引用依赖
        if ((dep.type === 'controller_reference' || 
             dep.type === 'controller_property_reference' ||
             dep.type === 'controller_static_reference') && 
            dep.sourceController === name) {
          // 这是自引用（引用当前正在生成的类），跳过不添加依赖
          console.log(`[DEBUG] 跳过自引用依赖: ${name} -> ${dep.sourceController} (类型: ${dep.type})`);
          return;
        }
        
        usedVariables.add(node.name);
        
        // 处理不同类型的依赖
        if (dep.type === 'variable_from_destructured') {
          // 解构赋值中的变量
          usedDependencies.add(dep.sourceDep);
        } else if (dep.type === 'variable_from_indirect_destructured') {
          // 间接解构赋值中的变量
          usedDependencies.add(dep.sourceDep);
        } else if (dep.type === 'require') {
          // 直接require的变量
          usedDependencies.add(node.name);
        } else if (dep.type === 'require_destructured') {
          // 解构赋值的依赖项
          usedDependencies.add(node.name);
        } else if (dep.type === 'indirect_destructured') {
          // 间接解构赋值的依赖项
          usedDependencies.add(dep.sourceVar);
        } else if (dep.type === 'controller_reference' || 
                   dep.type === 'controller_property_reference' ||
                   dep.type === 'controller_static_reference') {
          // 控制器引用（实例或静态）
          usedDependencies.add(dep.varName);
          console.log(`[DEBUG] 添加控制器引用依赖: ${name} -> ${dep.sourceController} (类型: ${dep.type})`);
        }
      } else {
        // 记录未找到依赖的变量，用于调试
        missingDependencies.add(node.name);
      }
      
      // 检测成员表达式中的标识符
      if (parent.type === 'MemberExpression' && parent.property === node) {
        if (parent.object.type === 'Identifier' && globalDependencies.has(parent.object.name)) {
          const dep = globalDependencies.get(parent.object.name);
          usedVariables.add(parent.object.name);
          
          if (dep.type === 'variable_from_destructured') {
            usedDependencies.add(dep.sourceDep);
          } else if (dep.type === 'variable_from_assignment') {
            usedDependencies.add(dep.sourceVar);
          } else {
            usedDependencies.add(parent.object.name);
          }
        }
      }
    }
  });
  
  // 递归追踪间接依赖
  const traceDependencies = (depName) => {
    if (globalDependencies.has(depName)) {
      const dep = globalDependencies.get(depName);
      
      if (dep.type === 'variable_from_assignment' && !usedDependencies.has(dep.sourceVar)) {
        usedDependencies.add(dep.sourceVar);
        traceDependencies(dep.sourceVar);
      } else if (dep.type === 'indirect_destructured' && !usedDependencies.has(dep.sourceVar)) {
        usedDependencies.add(dep.sourceVar);
        traceDependencies(dep.sourceVar);
      } else if (dep.type === 'variable_from_indirect_destructured' && !usedDependencies.has(dep.sourceDep)) {
        usedDependencies.add(dep.sourceDep);
        traceDependencies(dep.sourceDep);
      } else if ((dep.type === 'controller_reference' || 
                  dep.type === 'controller_property_reference' ||
                  dep.type === 'controller_static_reference') &&
                 !usedDependencies.has(dep.varName)) {
        usedDependencies.add(dep.varName);
      }
    }
  };
  
  // 初次收集后，进行深度追踪
  const initialDeps = Array.from(usedDependencies);
  initialDeps.forEach(depName => {
    traceDependencies(depName);
  });
  
  // 构建依赖关系图并进行拓扑排序
  const dependencyGraph = new Map();
  const visited = new Set();
  
  // 构建依赖关系
  const buildDependencyGraph = (depName) => {
    if (visited.has(depName) || !globalDependencies.has(depName)) return;
    
    visited.add(depName);
    const dep = globalDependencies.get(depName);
    
    if (!dependencyGraph.has(depName)) {
      dependencyGraph.set(depName, new Set());
    }
    
    // 添加依赖关系
    if (dep.type === 'indirect_destructured' && globalDependencies.has(dep.sourceVar)) {
      dependencyGraph.get(depName).add(dep.sourceVar);
      buildDependencyGraph(dep.sourceVar);
    } else if (dep.type === 'variable_from_indirect_destructured' && globalDependencies.has(dep.sourceDep)) {
      dependencyGraph.get(depName).add(dep.sourceDep);
      buildDependencyGraph(dep.sourceDep);
    } else if (dep.type === 'controller_reference' || dep.type === 'controller_property_reference') {
      // 控制器引用不添加依赖关系，避免循环依赖
      console.log(`[INFO] 控制器 ${name} 引用了控制器 ${dep.sourceController}`);
    }
  };
  
  // 为所有使用的依赖项构建依赖图
  usedDependencies.forEach(depName => buildDependencyGraph(depName));
  
  // 拓扑排序函数
  const topologicalSort = (graph) => {
    const visited = new Set();
    const result = [];
    
    const visit = (node) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      if (graph.has(node)) {
        for (const dependency of graph.get(node)) {
          visit(dependency);
        }
      }
      
      result.push(node);
    };
    
    // 从所有节点开始遍历
    for (const node of graph.keys()) {
      visit(node);
    }
    
    return result;
  };
  
  // 获取排序后的依赖项
  const sortedDependencies = topologicalSort(dependencyGraph);
  
  // 添加未在依赖图中的直接依赖
  usedDependencies.forEach(depName => {
    if (!sortedDependencies.includes(depName) && globalDependencies.has(depName)) {
      sortedDependencies.push(depName);
    }
  });
  
  // 按照排序后的顺序添加依赖声明
  const addedDeps = new Set();
  sortedDependencies.forEach(depName => {
    if (globalDependencies.has(depName) && !addedDeps.has(depName)) {
      const dep = globalDependencies.get(depName);
      
      // 关键修复：在最终生成阶段也过滤自引用依赖
      if ((dep.type === 'controller_reference' || 
           dep.type === 'controller_property_reference' ||
           dep.type === 'controller_static_reference') && 
          dep.sourceController === name) {
        console.log(`[DEBUG] 在最终生成阶段跳过自引用依赖: ${name} -> ${dep.sourceController}`);
        return;
      }
      
      // 对于require类型的依赖，添加相应的代码
      if (dep.type === 'require_destructured' || dep.type === 'require' || 
          dep.type === 'indirect_destructured' || 
          dep.type === 'controller_reference' || 
          dep.type === 'controller_property_reference' ||
          dep.type === 'controller_static_reference') {
        console.log(`[DEBUG] 添加依赖代码: ${depName} (类型: ${dep.type})`);
        content += `${dep.code}\n`;
      }
      
      addedDeps.add(depName);
    }
  });
  
  // 调试信息
  if (missingDependencies.size > 0) {
    console.log(`[DEBUG] 控制器 ${name} 中未找到依赖的变量:`, Array.from(missingDependencies));
  }
  
  if (usedDependencies.size > 0) {
    content += '\n';
  }
  
  // 只添加当前控制器类的代码
  content += `// ${name} 控制器类\n`;
  content += `${code}\n\n`;
  
  // 导出控制器类
  content += `module.exports = { ${name} };\n`;
  
  return content;
}

/**
 * 生成主入口文件
 */
function generateMainEntryFile(splitModules, originalFile) {
  let content = `/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: ${path.basename(originalFile)}
 * 拆分时间: ${new Date().toISOString()}
 * 控制器模块目录: sub-modules/
 */

`;
  
  // 添加所有控制器模块的require
  splitModules.forEach((moduleInfo, className) => {
    const modulePath = `./sub-modules/${moduleInfo.fileName.replace('.js', '')}`;
    content += `const ${moduleInfo.moduleName} = require('${modulePath}');\n`;
  });
  
  content += '\n';
  
  // 合并所有导出，保持原始导出结构
  content += `module.exports = {\n`;
  
  let exportCount = 0;
  splitModules.forEach((moduleInfo, className) => {
    if (moduleInfo.isExported) {
      content += `  ${moduleInfo.exportName}: ${moduleInfo.moduleName}.${className},\n`;
      exportCount++;
    }
  });
  
  content += `};\n`;
  
  console.log(`生成主入口文件: 包含 ${exportCount} 个导出项`);
  
  return content;
}

/**
 * 拆分控制器脚本
 */
function splitControllerScript(targetFile, outputDir, options = {}) {
  console.log(`开始拆分控制器脚本: ${targetFile}`);
  
  const { backup = true } = options;
  
  try {
    // 备份原始文件（只备份一次）
    if (backup) {
      const backupDir = path.dirname(targetFile);
      const fileName = path.basename(targetFile);
      const backupFile = path.join(backupDir, `${fileName}.split.bak`);
      
      // 如果备份文件不存在，才创建备份
      if (!fs.existsSync(backupFile)) {
        fs.copyFileSync(targetFile, backupFile);
        console.log(`✅ 创建原始文件备份: ${backupFile}`);
      } else {
        console.log(`ℹ️  备份文件已存在: ${backupFile}`);
      }
    }
    
    // 分析目标脚本
    const analysis = analyzeControllerScript(targetFile);
    const { controllers, exports } = analysis;
    
    if (controllers.size === 0) {
      throw new Error('未找到任何控制器类定义');
    }
    
    // 子模块目录路径
    const subModulesDir = path.join(outputDir, 'sub-modules');
    
    // 确保目录存在
    if (!fs.existsSync(subModulesDir)) {
      fs.mkdirSync(subModulesDir, { recursive: true });
    }
    
    console.log(`准备拆分 ${controllers.size} 个控制器到 sub-modules 目录`);
    
    // 生成控制器模块
    const splitModules = new Map();
    
    controllers.forEach((controllerInfo, className) => {
      const fileName = `${className.toLowerCase()}.js`;
      
      const content = generateControllerModule(controllerInfo, analysis.requiredModules, targetFile, analysis.code, controllers);
      
      splitModules.set(className, {
        moduleName: className.toLowerCase(),
        fileName,
        content,
        exportName: controllerInfo.exportName,
        isExported: controllerInfo.isExported
      });
    });
    
    // 写入控制器模块文件
    splitModules.forEach((moduleInfo, className) => {
      const filePath = path.join(subModulesDir, moduleInfo.fileName);
      fs.writeFileSync(filePath, moduleInfo.content, 'utf8');
      console.log(`生成控制器模块: sub-modules/${moduleInfo.fileName} (${className})`);
    });
    
    // 生成主入口文件
    const mainEntryContent = generateMainEntryFile(splitModules, targetFile);
    const mainEntryPath = path.join(outputDir, path.basename(targetFile));
    fs.writeFileSync(mainEntryPath, mainEntryContent, 'utf8');
    console.log(`生成主入口文件: ${path.basename(targetFile)}`);
    
    console.log(`\n✅ 控制器拆分完成！`);
    console.log(`- 拆分了 ${splitModules.size} 个控制器到 sub-modules 目录`);
    console.log(`- 主入口文件: ${path.basename(targetFile)}（保持原文件名）`);
    console.log(`- 原有引用可以继续使用 require('./${path.basename(targetFile)}')`);
    
    return {
      splitModules: Array.from(splitModules.entries()).map(([className, info]) => ({
        className,
        moduleName: info.moduleName,
        fileName: info.fileName,
        exportName: info.exportName,
        isExported: info.isExported
      })),
      mainEntryFile: mainEntryPath,
      subModulesDir: subModulesDir
    };
    
  } catch (error) {
    console.error(`❌ 控制器拆分失败: ${error.message}`);
    throw error;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node split.js <目标加密脚本> [输出目录]');
    console.log('示例: node split.js 目标-加密-脚本.js');
    console.log('       node split.js 目标-加密-脚本.js ./controller-result');
    process.exit(1);
  }
  
  const targetFile = args[0];
  const outputDir = args[1] || path.dirname(targetFile);
  
  try {
    // 执行拆分
    const result = splitControllerScript(targetFile, outputDir);
    console.log('✅ 控制器拆分完成！');
    
  } catch (error) {
    console.error('拆分失败:', error.message);
    process.exit(1);
  }
}

module.exports = {
  splitControllerScript,
  extractGlobalDependencies, 
  analyzeControllerScript
};