/**
 * 修正版的 split.js - 增强子模块间引用支持
 * 主要改进：
 * 1. 增强依赖分析，处理子模块间的相互引用
 * 2. 改进拓扑排序算法，处理循环依赖
 * 3. 添加子模块间引用检测
 */

const fs = require('fs');
const path = require('path');

// 复用 lib 目录中的AST工具
const { parseCode, traverse, generate } = require('./lib/ast-utils');

/**
 * 增强的依赖分析函数 - 处理子模块间引用
 */
function extractGlobalDependenciesWithInterdependencies(originalCode, targetFile, allControllers) {
  const ast = parseCode(originalCode);
  const dependencies = new Map(); // 变量名 -> 依赖内容
  const variableAssignments = new Map(); // 变量名 -> 赋值内容
  
  // 收集所有控制器类名，用于检测子模块间引用
  const controllerNames = new Set(allControllers.keys());
  
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
  ast.program.body.forEach(node => {
    if (node.type === 'ClassDeclaration') {
      const className = node.id?.name;
      if (className && controllerNames.has(className)) {
        // 分析类中的构造函数和方法
        traverse(node, {
          NewExpression(path) {
            const callee = path.node.callee;
            if (callee.type === 'Identifier' && controllerNames.has(callee.name)) {
              // 检测到 new OtherController() 这种引用
              const refControllerName = callee.name;
              if (refControllerName !== className) {
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
              }
            }
          },
          
          MemberExpression(path) {
            const object = path.node.object;
            const property = path.node.property;
            
            // 检测 this.otherController.method() 这种引用
            if (object.type === 'ThisExpression' && 
                property.type === 'Identifier' && 
                controllerNames.has(property.name)) {
              const refControllerName = property.name;
              if (refControllerName !== className) {
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
              }
            }
          }
        });
      }
    }
  });
  
  return dependencies;
}

/**
 * 改进的拓扑排序算法 - 处理循环依赖
 */
function topologicalSortWithCycleDetection(graph) {
  const visited = new Set();
  const visiting = new Set(); // 用于检测循环
  const result = [];
  const cycles = [];
  
  const visit = (node, path = []) => {
    if (visiting.has(node)) {
      // 检测到循环依赖
      const cyclePath = [...path, node];
      cycles.push(cyclePath);
      return;
    }
    
    if (visited.has(node)) return;
    
    visiting.add(node);
    
    if (graph.has(node)) {
      for (const dependency of graph.get(node)) {
        visit(dependency, [...path, node]);
      }
    }
    
    visiting.delete(node);
    visited.add(node);
    result.push(node);
  };
  
  // 从所有节点开始遍历
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      visit(node);
    }
  }
  
  // 如果有循环依赖，输出警告信息
  if (cycles.length > 0) {
    console.warn('⚠️  检测到循环依赖:');
    cycles.forEach(cycle => {
      console.warn(`  循环路径: ${cycle.join(' -> ')}`);
    });
    
    // 对循环依赖进行特殊处理：按字母顺序排序
    const cycleNodes = new Set(cycles.flat());
    const sortedCycleNodes = Array.from(cycleNodes).sort();
    
    // 将循环依赖的节点按顺序插入结果中
    sortedCycleNodes.forEach(node => {
      if (!visited.has(node)) {
        result.push(node);
        visited.add(node);
      }
    });
  }
  
  return result;
}

/**
 * 生成增强的控制器模块 - 支持子模块间引用
 */
function generateEnhancedControllerModule(controllerInfo, allRequiredModules, targetFile, originalCode, allControllers) {
  const { name, code } = controllerInfo;
  
  let content = `/**
 * ${name} 控制器模块 - 增强版本（支持子模块间引用）
 * 自动处理与其他控制器模块的依赖关系
 */

`;
  
  // 使用增强的依赖分析
  const globalDependencies = extractGlobalDependenciesWithInterdependencies(originalCode, targetFile, allControllers);
  
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
        } else if (dep.type === 'controller_reference' || dep.type === 'controller_property_reference') {
          // 控制器引用
          usedDependencies.add(dep.varName);
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
      }
    }
  };
  
  // 初次收集后，进行深度追踪
  const initialDeps = Array.from(usedDependencies);
  initialDeps.forEach(depName => {
    traceDependencies(depName);
  });
  
  // 构建依赖关系图并进行改进的拓扑排序
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
  
  // 使用改进的拓扑排序
  const sortedDependencies = topologicalSortWithCycleDetection(dependencyGraph);
  
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
      
      // 对于require类型的依赖，添加相应的代码
      if (dep.type === 'require_destructured' || dep.type === 'require' || 
          dep.type === 'indirect_destructured' || 
          dep.type === 'controller_reference' || dep.type === 'controller_property_reference') {
        content += `${dep.code}
`;
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
  content += `// ${name} 控制器类
`;
  content += `${code}\n\n`;
  
  // 导出控制器类
  content += `module.exports = { ${name} };\n`;
  
  return content;
}

// 导出增强的函数
module.exports = {
  extractGlobalDependenciesWithInterdependencies,
  topologicalSortWithCycleDetection,
  generateEnhancedControllerModule
};