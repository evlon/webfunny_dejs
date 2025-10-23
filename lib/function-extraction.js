/**
 * 函数提取和依赖分析模块
 * 负责提取函数定义、分析依赖关系等
 */

const { extractFunctionName, isInitializationFunction, extractConstantArguments, parseCode, traverse, generate } = require('./ast-utils');

/**
 * 收集函数参数中的依赖关系（如 f2(f1) 这种模式）
 */
function collectParameterDependencies(code, config) {
  const parameterDependencies = new Set();
  
  try {
    const ast = parseCode(code);

    traverse(ast, {
      CallExpression(path) {
        const funcName = extractFunctionName(path.node.callee);
        
        if (funcName && config.interceptPattern.test(funcName)) {
          // 检查函数参数中是否包含其他函数引用
          path.node.arguments.forEach((arg, index) => {
            if (arg.type === 'Identifier') {
              const argFuncName = arg.name;
              if (config.interceptPattern.test(argFuncName)) {
                // 发现参数依赖：funcName 的参数引用了 argFuncName
                parameterDependencies.add(argFuncName);
                if (config.verbose) {
                  console.log(`  [参数依赖] ${funcName} 的参数 ${index} 引用了函数 ${argFuncName}`);
                }
              }
            }
          });
        }
      }
    });
  } catch (error) {
    if (config.verbose) {
      console.log(`  [警告] 收集参数依赖失败: ${error.message}`);
    }
  }
  
  return parameterDependencies;
}

/**
 * 收集初始化函数中调用的所有函数（包括嵌套依赖和参数依赖）
 */
function collectInitializationFunctionCalls(code, config) {
  const initializationCalls = new Set();
  
  try {
    const ast = parseCode(code);

    traverse(ast, {
      CallExpression(path) {
        const funcName = extractFunctionName(path.node.callee);
        
        if (funcName && config.interceptPattern.test(funcName)) {
          // 检查是否是初始化函数调用
          if (isInitializationFunction(path)) {
            initializationCalls.add(funcName);
            if (config.verbose) {
              console.log(`  [初始化依赖] ${funcName} 被初始化函数调用`);
            }
          }
        }
      }
    });

    // 收集参数依赖
    const parameterDeps = collectParameterDependencies(code, config);
    parameterDeps.forEach(dep => initializationCalls.add(dep));

    // 递归分析依赖关系（包括参数依赖和调用依赖）
    let hasNewDependencies = true;
    while (hasNewDependencies) {
      hasNewDependencies = false;
      const currentCalls = new Set(initializationCalls);
      
      traverse(ast, {
        FunctionDeclaration(path) {
          const funcName = path.node.id?.name;
          if (funcName && currentCalls.has(funcName)) {
            // 分析这个函数内部调用的其他函数
            traverse(path.node, {
              CallExpression(innerPath) {
                const calledFuncName = extractFunctionName(innerPath.node.callee);
                if (calledFuncName && config.interceptPattern.test(calledFuncName)) {
                  if (!initializationCalls.has(calledFuncName)) {
                    initializationCalls.add(calledFuncName);
                    hasNewDependencies = true;
                    if (config.verbose) {
                      console.log(`  [嵌套依赖] ${funcName} 调用 ${calledFuncName}`);
                    }
                  }
                }
              }
            }, path.scope);
            
            // 分析这个函数参数中的依赖
            path.node.params.forEach((param, index) => {
              if (param.type === 'Identifier') {
                const paramName = param.name;
                if (config.interceptPattern.test(paramName) && !initializationCalls.has(paramName)) {
                  initializationCalls.add(paramName);
                  hasNewDependencies = true;
                  if (config.verbose) {
                    console.log(`  [参数依赖] ${funcName} 的参数 ${index} 引用了函数 ${paramName}`);
                  }
                }
              }
            });
          }
        },
        
        VariableDeclarator(path) {
          if (path.node.init && path.node.init.type === 'FunctionExpression') {
            const funcName = path.node.id?.name;
            if (funcName && currentCalls.has(funcName)) {
              // 分析函数表达式内部调用的其他函数
              traverse(path.node.init, {
                CallExpression(innerPath) {
                  const calledFuncName = extractFunctionName(innerPath.node.callee);
                  if (calledFuncName && config.interceptPattern.test(calledFuncName)) {
                    if (!initializationCalls.has(calledFuncName)) {
                      initializationCalls.add(calledFuncName);
                      hasNewDependencies = true;
                      if (config.verbose) {
                        console.log(`  [嵌套依赖] ${funcName} 调用 ${calledFuncName}`);
                      }
                    }
                  }
                }
              }, path.scope);
              
              // 分析函数表达式参数中的依赖
              if (path.node.init.params) {
                path.node.init.params.forEach((param, index) => {
                  if (param.type === 'Identifier') {
                    const paramName = param.name;
                    if (config.interceptPattern.test(paramName) && !initializationCalls.has(paramName)) {
                      initializationCalls.add(paramName);
                      hasNewDependencies = true;
                      if (config.verbose) {
                        console.log(`  [参数依赖] ${funcName} 的参数 ${index} 引用了函数 ${paramName}`);
                      }
                    }
                  }
                });
              }
            }
          }
        }
      });
    }
  } catch (error) {
    if (config.verbose) {
      console.log(`  [警告] 收集初始化函数调用失败: ${error.message}`);
    }
  }
  
  if (config.verbose && initializationCalls.size > 0) {
    console.log(`  [依赖分析完成] 共找到 ${initializationCalls.size} 个依赖函数: ${Array.from(initializationCalls).join(', ')}`);
  }
  
  return initializationCalls;
}

/**
 * 构建完整的函数依赖图（包括参数依赖、调用依赖等）
 */
function buildFunctionDependencyGraph(code, config) {
  const dependencyGraph = new Map();
  
  try {
    const ast = parseCode(code);

    // 先收集所有匹配的函数
    const allFunctions = new Set();
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && config.interceptPattern.test(funcName)) {
          allFunctions.add(funcName);
          dependencyGraph.set(funcName, new Set());
        }
      },
      
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName && config.interceptPattern.test(funcName)) {
            allFunctions.add(funcName);
            dependencyGraph.set(funcName, new Set());
          }
        }
      }
    });

    // 分析每个函数的依赖关系
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && dependencyGraph.has(funcName)) {
          const dependencies = dependencyGraph.get(funcName);
          
          // 分析函数体中的调用依赖
          traverse(path.node, {
            CallExpression(innerPath) {
              const calledFuncName = extractFunctionName(innerPath.node.callee);
              if (calledFuncName && allFunctions.has(calledFuncName) && calledFuncName !== funcName) {
                dependencies.add(calledFuncName);
              }
              
              // 分析函数调用参数中的依赖
              innerPath.node.arguments.forEach(arg => {
                if (arg.type === 'Identifier' && allFunctions.has(arg.name) && arg.name !== funcName) {
                  dependencies.add(arg.name);
                }
              });
            }
          }, path.scope);
          
          // 分析函数参数中的依赖
          path.node.params.forEach(param => {
            if (param.type === 'Identifier' && allFunctions.has(param.name) && param.name !== funcName) {
              dependencies.add(param.name);
            }
          });
        }
      },
      
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName && dependencyGraph.has(funcName)) {
            const dependencies = dependencyGraph.get(funcName);
            
            // 分析函数表达式体中的调用依赖
            traverse(path.node.init, {
              CallExpression(innerPath) {
                const calledFuncName = extractFunctionName(innerPath.node.callee);
                if (calledFuncName && allFunctions.has(calledFuncName) && calledFuncName !== funcName) {
                  dependencies.add(calledFuncName);
                }
                
                // 分析函数调用参数中的依赖
                innerPath.node.arguments.forEach(arg => {
                  if (arg.type === 'Identifier' && allFunctions.has(arg.name) && arg.name !== funcName) {
                    dependencies.add(arg.name);
                  }
                });
              }
            }, path.scope);
            
            // 分析函数表达式参数中的依赖
            if (path.node.init.params) {
              path.node.init.params.forEach(param => {
                if (param.type === 'Identifier' && allFunctions.has(param.name) && param.name !== funcName) {
                  dependencies.add(param.name);
                }
              });
            }
          }
        }
      }
    });

    if (config.verbose) {
      console.log(`  [依赖图构建完成] 共分析 ${dependencyGraph.size} 个函数的依赖关系`);
      dependencyGraph.forEach((deps, func) => {
        if (deps.size > 0) {
          console.log(`    ${func} -> ${Array.from(deps).join(', ')}`);
        }
      });
    }
    
  } catch (error) {
    if (config.verbose) {
      console.log(`  [警告] 构建依赖图失败: ${error.message}`);
    }
  }
  
  return dependencyGraph;
}

/**
 * 拓扑排序算法
 */
function topologicalSort(graph) {
  const visited = new Set();
  const visiting = new Set();
  const result = [];
  
  function visit(node) {
    if (visiting.has(node)) {
      throw new Error(`发现循环依赖: ${node}`);
    }
    
    if (!visited.has(node)) {
      visiting.add(node);
      
      // 先访问所有依赖节点
      const dependencies = graph.get(node) || new Set();
      for (const dep of dependencies) {
        if (graph.has(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(node);
      visited.add(node);
      result.push(node);
    }
  }
  
  // 对图中的每个节点进行排序
  for (const node of graph.keys()) {
    visit(node);
  }
  
  return result;
}

module.exports = {
  collectParameterDependencies,
  collectInitializationFunctionCalls,
  buildFunctionDependencyGraph,
  topologicalSort
};