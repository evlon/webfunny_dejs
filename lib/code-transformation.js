/**
 * 代码转换和清理模块
 * 负责应用函数调用替换、清理已解密的函数等
 */
const { createConfig, shouldInterceptFunction } = require('./config');
const { extractFunctionName, parseCode, traverse, generate, babelTypes } = require('./ast-utils');

/**
 * 应用基于调用表达式的替换（新方案）
 */
function applyCallExpressionReplacements(code, callExpressionMap, config) {
  // 如果禁用替换，直接返回原始代码
  if (config.disableReplace || callExpressionMap.size === 0) {
    return code;
  }

  try {
    const ast = parseCode(code);

    let replaceCount = 0;

    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier') {
          const funcName = path.node.callee.name;
          
          // 跳过拦截器调用
          if (funcName === '__interceptFunctionCall') {
            return;
          }
          
          // 检查是否匹配拦截模式
          if (shouldInterceptFunction(config, funcName, path.node.arguments.length)) {
            let callExpression;
            try {
              // 使用 generate 函数安全地生成调用表达式代码
              callExpression = generate(path.node).code;
            } catch (error) {
              // 如果生成失败，尝试使用 toString
              callExpression = path.toString();
            }
            
            // 确保调用表达式是有效的字符串
            if (typeof callExpression === 'string' && callExpression !== '[object Object]') {
              if (callExpressionMap.has(callExpression)) {
                const result = callExpressionMap.get(callExpression);
                
                // 根据结果类型创建对应的字面量节点
                let replacementNode;
                if (typeof result === 'string') {
                  replacementNode = babelTypes.stringLiteral(result);
                } else if (typeof result === 'number') {
                  replacementNode = babelTypes.numericLiteral(result);
                } else if (typeof result === 'boolean') {
                  replacementNode = babelTypes.booleanLiteral(result);
                } else if (result === null) {
                  replacementNode = babelTypes.nullLiteral();
                } else if (result === undefined) {
                  replacementNode = babelTypes.identifier('undefined');
                } else {
                  // 对于复杂类型，使用字符串表示或跳过
                  if (config.verbose) {
                    console.log(`  [跳过] ${callExpression} -> 复杂类型: ${typeof result}`);
                  }
                  return;
                }
                
                path.replaceWith(replacementNode);
                replaceCount++;
                
                if (config.verbose) {
                  console.log(`  [替换] ${callExpression} -> ${JSON.stringify(result)}`);
                }
              }
            }
          }
        }
      }
    });

    if (config.verbose) {
      console.log(`  [替换完成] 替换了 ${replaceCount} 处函数调用`);
    }

    const { code: newCode } = generate(ast);
    return newCode;
  } catch (error) {
    console.error('AST替换失败:', error.message);
    return code;
  }
}

/**
 * 分析哪些函数和立即执行函数可以被清理
 */
function analyzeFunctionsForCleanup(code, callExpressionMap, actualCalls, config) {
  const functionsToCleanup = new Set();
  const immediateFunctionsToCleanup = new Set();
  
  try {
    const ast = parseCode(code);

    // 收集所有匹配的函数
    const allFunctions = new Set();
    const functionReferences = new Map(); // 函数引用次数
    const exportedFunctions = new Set(); // 导出的函数

    // 收集导出的函数
    let hasConditionalExport = false;
    
    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration && path.node.declaration.type === 'FunctionDeclaration') {
          exportedFunctions.add(path.node.declaration.id.name);
        }
      },
      ExportDefaultDeclaration(path) {
        if (path.node.declaration && path.node.declaration.type === 'FunctionDeclaration') {
          exportedFunctions.add(path.node.declaration.id.name);
        }
      },
      AssignmentExpression(path) {
        // 检测 CommonJS exports: module.exports.funcName = function
        if (path.node.left.type === 'MemberExpression' &&
            path.node.left.object.type === 'MemberExpression' &&
            path.node.left.object.object?.name === 'module' &&
            path.node.left.object.property?.name === 'exports' &&
            path.node.left.property?.type === 'Identifier') {
          
          const exportedFuncName = path.node.left.property.name;
          exportedFunctions.add(exportedFuncName);
          if (config.verbose) {
            console.log(`  [导出检测] CommonJS导出: ${exportedFuncName}`);
          }
        }
        // 检测 exports.funcName = function
        else if (path.node.left.type === 'MemberExpression' &&
                 path.node.left.object?.name === 'exports' &&
                 path.node.left.property?.type === 'Identifier') {
          
          const exportedFuncName = path.node.left.property.name;
          exportedFunctions.add(exportedFuncName);
          if (config.verbose) {
            console.log(`  [导出检测] exports导出: ${exportedFuncName}`);
          }
        }
        // 检测 module.exports = { funcName: func } 或 module.exports = func
        else if (path.node.left.type === 'MemberExpression' &&
                 path.node.left.object?.name === 'module' &&
                 path.node.left.property?.name === 'exports') {
          
          // 检查是否有条件语句包装
          const isInConditional = path.findParent(p => 
            p.isIfStatement() || p.isConditionalExpression() 
          );
          
          if (isInConditional) {
            hasConditionalExport = true;
            if (config.verbose) {
              console.log(`  [导出检测] 检测到条件导出: ${generate(path.node).code}`);
            }
            // 对于条件导出，我们保守地不添加任何导出函数到 exportedFunctions
            return;
          }
          
          // 处理对象导出 module.exports = { func1: f1, func2: f2 }
          if (path.node.right.type === 'ObjectExpression') {
            let hasUncertainValue = false;
            
            // 检查对象属性中是否有不确定的值（如条件表达式、变量引用等）
            path.node.right.properties.forEach(prop => {
              if (prop.type === 'ObjectProperty') {
                // 检查属性值是否是确定的值（Identifier、Literal等）
                if (prop.value.type === 'ConditionalExpression' || 
                    prop.value.type === 'CallExpression' ||
                    prop.value.type === 'MemberExpression') {
                  hasUncertainValue = true;
                }
                
                // 如果是确定的标识符，添加导出
                if (prop.value.type === 'Identifier') {
                  exportedFunctions.add(prop.value.name);
                  if (config.verbose) {
                    console.log(`  [导出检测] module.exports对象导出: ${prop.value.name}`);
                  }
                }
              }
            });
            
            // 如果对象包含不确定的值，采取保守策略
            if (hasUncertainValue) {
              hasConditionalExport = true;
              if (config.verbose) {
                console.log(`  [导出检测] 对象包含不确定值，采取保守策略: ${generate(path.node.right).code.substring(0, 100)}...`);
              }
              // 清空已添加的导出函数，因为存在不确定性
              for (const prop of path.node.right.properties) {
                if (prop.type === 'ObjectProperty' && prop.value.type === 'Identifier') {
                  exportedFunctions.delete(prop.value.name);
                }
              }
            }
          }
          // 处理直接赋值 module.exports = f1
          else if (path.node.right.type === 'Identifier') {
            // 检查这个变量是否引用包含不确定值的对象
            const variableName = path.node.right.name;
            let hasUncertainReferences = false;
            
            // 查找这个变量的声明
            const variableDeclaration = path.scope.getBinding(variableName)?.path;
            if (variableDeclaration && 
                variableDeclaration.isVariableDeclarator() && 
                variableDeclaration.node.init) {
              
              // 检查变量初始化值是否包含不确定的值
              const initNode = variableDeclaration.node.init;
              if (initNode.type === 'ObjectExpression') {
                // 检查对象属性中是否有不确定的值
                initNode.properties.forEach(prop => {
                  if (prop.type === 'ObjectProperty' && 
                      (prop.value.type === 'ConditionalExpression' || 
                       prop.value.type === 'CallExpression' ||
                       prop.value.type === 'MemberExpression')) {
                    hasUncertainReferences = true;
                  }
                });
              }
            }
            
            if (hasUncertainReferences) {
              hasConditionalExport = true;
              if (config.verbose) {
                console.log(`  [导出检测] 变量引用包含不确定值: ${variableName}`);
              }
            } else {
              exportedFunctions.add(variableName);
              if (config.verbose) {
                console.log(`  [导出检测] module.exports直接导出: ${variableName}`);
              }
            }
          }
          // 处理其他不确定的导出值（如条件表达式、函数调用等）
          else if (path.node.right.type !== 'ObjectExpression' && 
                   path.node.right.type !== 'Identifier' &&
                   path.node.right.type !== 'Literal') {
            hasConditionalExport = true;
            if (config.verbose) {
              console.log(`  [导出检测] 不确定的导出值: ${generate(path.node).code}`);
            }
          }
        }
      },
      ObjectProperty(path) {
        // 检测 module.exports = { funcName: func }
        if (path.parentPath && 
            path.parentPath.parentPath &&
            path.parentPath.parentPath.node.type === 'AssignmentExpression' &&
            path.parentPath.parentPath.node.left.type === 'MemberExpression' &&
            path.parentPath.parentPath.node.left.object?.name === 'module' &&
            path.parentPath.parentPath.node.left.property?.name === 'exports') {
          
          if (path.node.key.type === 'Identifier' && 
              path.node.value.type === 'Identifier') {
            const exportedFuncName = path.node.value.name;
            exportedFunctions.add(exportedFuncName);
            if (config.verbose) {
              console.log(`  [导出检测] module.exports对象导出: ${exportedFuncName}`);
            }
          }
        }
      }
    });

    // 收集所有匹配的函数并统计引用
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && config.interceptPattern.test(funcName)) {
          allFunctions.add(funcName);
          functionReferences.set(funcName, 0);
        }
      },
      
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName && config.interceptPattern.test(funcName)) {
            allFunctions.add(funcName);
            functionReferences.set(funcName, 0);
          }
        }
      },
      
      CallExpression(path) {
        const funcName = extractFunctionName(path.node.callee);
        if (funcName && allFunctions.has(funcName)) {
          functionReferences.set(funcName, (functionReferences.get(funcName) || 0) + 1);
        }
      }
    });

    // 分析哪些函数可以被清理
    // 如果存在条件导出，采取保守策略，不清理任何函数
    if (hasConditionalExport) {
      if (config.verbose) {
        console.log(`  [清理分析] 检测到条件导出，采取保守策略，不清理任何函数`);
      }
    } else {
      for (const funcName of allFunctions) {
        // 跳过导出的函数
        if (exportedFunctions.has(funcName)) {
          if (config.verbose) {
            console.log(`  [清理分析] 跳过导出的函数: ${funcName}`);
          }
          continue;
        }

        // 检查是否只被常量函数调用
        const isOnlyCalledByConstants = actualCalls.some(call => call.funcName === funcName);
        
        // 检查引用次数
        const referenceCount = functionReferences.get(funcName) || 0;
        
        // 如果函数只被常量函数调用 或者 引用次数少，可以考虑清理
        if (isOnlyCalledByConstants || referenceCount <= actualCalls.filter(call => call.funcName === funcName).length) {
          functionsToCleanup.add(funcName);
          if (config.verbose) {
            console.log(`  [清理分析] 可以清理的函数: ${funcName} (引用次数: ${referenceCount})`);
          }
        }
      }
    }

    // 分析立即执行函数是否可以清理
    // 新策略：清理出现在第一个require(...)之前的立即执行函数
    let hasSeenRequire = false;
    let firstRequireLine = -1;
    
    // 首先找到第一个require语句的位置
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
          if (!hasSeenRequire) {
            hasSeenRequire = true;
            // 记录第一个require语句的位置
            if (path.node.loc) {
              firstRequireLine = path.node.loc.start.line;
              if (config.verbose) {
                console.log(`  [清理分析] 找到第一个require语句在第 ${firstRequireLine} 行`);
              }
            }
          }
        }
      }
    });
    
    if (!hasSeenRequire) {
      // 如果没有找到require语句，不清理任何立即执行函数
      if (config.verbose) {
        console.log(`  [清理分析] 未找到require语句，不清理任何立即执行函数`);
      }
      return {
        functions: functionsToCleanup,
        immediateFunctions: immediateFunctionsToCleanup
      };
    }
    
    // 收集所有在第一个require之前的立即执行函数
    traverse(ast, {
      ExpressionStatement(path) {
        if (path.node.expression.type === 'CallExpression' && 
            path.node.expression.callee.type === 'FunctionExpression') {
          
          const immediateFunctionCode = generate(path.node).code;
          const immediateFunctionKey = `immediate_${Buffer.from(immediateFunctionCode).toString('base64').substring(0, 10)}`;
          
          // 检查立即执行函数的位置是否在第一个require之前
          if (path.node.expression.loc) {
            const immediateFunctionLine = path.node.expression.loc.start.line;
            
            if (immediateFunctionLine < firstRequireLine) {
              // 在第一个require之前的立即执行函数可以清理
              immediateFunctionsToCleanup.add(immediateFunctionKey);
              if (config.verbose) {
                console.log(`  [清理分析] 可以清理的立即执行函数（第 ${immediateFunctionLine} 行，在require之前）: ${immediateFunctionCode.substring(0, 100)}...`);
              }
            } else {
              if (config.verbose) {
                console.log(`  [清理分析] 跳过第 ${immediateFunctionLine} 行的立即执行函数（在require之后）`);
              }
            }
          }
        }
      }
    });

  } catch (error) {
    if (config.verbose) {
      console.log(`  [警告] 清理分析失败: ${error.message}`);
    }
  }
  
  return {
    functions: functionsToCleanup,
    immediateFunctions: immediateFunctionsToCleanup
  };
}

/**
 * 清理已解密的函数和立即执行函数（注释或删除）
 * 按照函数的最上层调用者分类：
 * - 第一类：被导出的函数（不能清理）
 * - 第二类：未被导出的函数（可以清理）
 * 顶层立即执行函数虽然被引用，但不应被归类为第一类
 */
function cleanupDecryptedFunctions(code, cleanupData, cleanupMode, config) {
  const { functions: functionsToCleanup, immediateFunctions: immediateFunctionsToCleanup } = cleanupData;
  
  if ((functionsToCleanup.size === 0 && immediateFunctionsToCleanup.size === 0) || cleanupMode === 'none') {
    return code;
  }

  try {
    const ast = parseCode(code);
    let functionCleanupCount = 0;
    let immediateFunctionCleanupCount = 0;

    // 第一阶段：构建函数分类系统
    const category1Functions = new Set(); // 第一类：被导出的函数（不能清理）
    const category2Functions = new Set(); // 第二类：未被导出的函数（可以清理）
    
    // 收集所有导出的函数
    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.declaration && path.node.declaration.type === 'FunctionDeclaration') {
          category1Functions.add(path.node.declaration.id.name);
        }
      },
      ExportDefaultDeclaration(path) {
        if (path.node.declaration && path.node.declaration.type === 'FunctionDeclaration') {
          category1Functions.add(path.node.declaration.id.name);
        }
      },
      AssignmentExpression(path) {
        // 检测 CommonJS exports: module.exports.funcName = function
        if (path.node.left.type === 'MemberExpression' &&
            path.node.left.object.type === 'MemberExpression' &&
            path.node.left.object.object?.name === 'module' &&
            path.node.left.object.property?.name === 'exports' &&
            path.node.left.property?.type === 'Identifier') {
          
          const exportedFuncName = path.node.left.property.name;
          category1Functions.add(exportedFuncName);
        }
        // 检测 exports.funcName = function
        else if (path.node.left.type === 'MemberExpression' &&
                 path.node.left.object?.name === 'exports' &&
                 path.node.left.property?.type === 'Identifier') {
          
          const exportedFuncName = path.node.left.property.name;
          category1Functions.add(exportedFuncName);
        }
        // 检测 module.exports = { funcName: func }
        else if (path.node.left.type === 'MemberExpression' &&
                 path.node.left.object?.name === 'module' &&
                 path.node.left.property?.name === 'exports' &&
                 path.node.right.type === 'ObjectExpression') {
          
          path.node.right.properties.forEach(prop => {
            if (prop.type === 'ObjectProperty' && 
                prop.key.type === 'Identifier' &&
                prop.value.type === 'Identifier') {
              category1Functions.add(prop.value.name);
            }
          });
        }
      }
    });

    // 第二阶段：分类函数
    // 遍历所有待清理的函数，根据是否被导出进行分类
    for (const funcName of functionsToCleanup) {
      if (category1Functions.has(funcName)) {
        if (config.verbose) {
          console.log(`  [分类] 第一类（被导出，不清理）: ${funcName}`);
        }
      } else {
        category2Functions.add(funcName);
        if (config.verbose) {
          console.log(`  [分类] 第二类（未被导出，可清理）: ${funcName}`);
        }
      }
    }

    // 第三阶段：清理第二类函数
    if (category2Functions.size > 0) {
      // 构建依赖关系图，确保安全清理
      const dependencyGraph = new Map();
      
      // 初始化所有函数的依赖图
      traverse(ast, {
        FunctionDeclaration(path) {
          const funcName = path.node.id?.name;
          if (funcName) {
            dependencyGraph.set(funcName, new Set());
          }
        },
        VariableDeclarator(path) {
          if (path.node.init && path.node.init.type === 'FunctionExpression') {
            const funcName = path.node.id?.name;
            if (funcName) {
              dependencyGraph.set(funcName, new Set());
            }
          }
        }
      });

      // 分析函数调用关系
      traverse(ast, {
        CallExpression(path) {
          const caller = path.findParent(p => 
            p.isFunctionDeclaration() || 
            (p.isVariableDeclarator() && p.node.init?.type === 'FunctionExpression')
          );
          
          const callerName = caller?.isFunctionDeclaration() 
            ? caller.node.id?.name 
            : caller?.isVariableDeclarator() ? caller.node.id?.name : null;
          
          const calleeName = extractFunctionName(path.node.callee);
          
          if (callerName && calleeName && dependencyGraph.has(callerName)) {
            dependencyGraph.get(callerName).add(calleeName);
          }
        }
      });

      // 找到可以安全清理的函数（叶子节点或不被业务逻辑依赖的函数）
      const functionsSafeToClean = new Set(category2Functions);
      
      // 保护第一类函数及其依赖链
      const visited = new Set();
      const protectionStack = [...category1Functions];
      
      while (protectionStack.length > 0) {
        const currentFunc = protectionStack.pop();
        if (!visited.has(currentFunc)) {
          visited.add(currentFunc);
          
          // 向上保护调用者
          for (const [caller, deps] of dependencyGraph) {
            if (deps.has(currentFunc)) {
              protectionStack.push(caller);
              functionsSafeToClean.delete(caller);
            }
          }
          
          // 向下保护依赖
          for (const dep of dependencyGraph.get(currentFunc) || []) {
            protectionStack.push(dep);
            functionsSafeToClean.delete(dep);
          }
        }
      }

      // 实际清理第二类函数
      traverse(ast, {
        FunctionDeclaration(path) {
          const funcName = path.node.id?.name;
          if (funcName && functionsSafeToClean.has(funcName)) {
            if (cleanupMode === 'comment') {
              const functionCode = generate(path.node).code;
              const commentedCode = `/* [解密清理] 已解密的函数: ${funcName} */\n/*${functionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
              path.replaceWithMultiple(parseCode(commentedCode).program.body);
            } else {
              path.remove();
            }
            functionCleanupCount++;
            
            if (config.verbose) {
              console.log(`  [清理] ${cleanupMode === 'comment' ? '注释' : '删除'}第二类函数: ${funcName}`);
            }
          }
        },
        
        VariableDeclarator(path) {
          if (path.node.init && path.node.init.type === 'FunctionExpression') {
            const funcName = path.node.id?.name;
            if (funcName && functionsSafeToClean.has(funcName)) {
              if (cleanupMode === 'comment') {
                const functionCode = generate(path.node).code;
                const commentedCode = `/* [解密清理] 已解密的函数表达式: ${funcName} */\n/*${functionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
                path.replaceWithMultiple(parseCode(commentedCode).program.body);
              } else {
                path.remove();
              }
              functionCleanupCount++;
              
              if (config.verbose) {
                console.log(`  [清理] ${cleanupMode === 'comment' ? '注释' : '删除'}第二类函数表达式: ${funcName}`);
              }
            }
          }
        }
      });
    }

    // 第四阶段：清理立即执行函数
    // 验证顶层立即执行函数：虽然被引用，但不应被归类为第一类
    if (immediateFunctionsToCleanup.size > 0) {
      // 找到第一个require语句的位置
      let firstRequireLine = Infinity;
      traverse(ast, {
        CallExpression(path) {
          if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
            if (path.node.loc && path.node.loc.start.line < firstRequireLine) {
              firstRequireLine = path.node.loc.start.line;
            }
          }
        }
      });

      // 清理在第一个require之前的立即执行函数
      traverse(ast, {
        ExpressionStatement(path) {
          if (path.node.expression.type === 'CallExpression' && 
              path.node.expression.callee.type === 'FunctionExpression') {
            
            const immediateFunctionCode = generate(path.node).code;
            const immediateFunctionKey = `immediate_${Buffer.from(immediateFunctionCode).toString('base64').substring(0, 10)}`;
            
            if (immediateFunctionsToCleanup.has(immediateFunctionKey)) {
              // 检查立即执行函数的位置
              const immediateFunctionLine = path.node.expression.loc?.start.line || Infinity;
              
              // 顶层立即执行函数虽然被引用，但应该清理（在require之前）
              if (firstRequireLine === Infinity || immediateFunctionLine < firstRequireLine) {
                if (cleanupMode === 'comment') {
                  const commentedCode = `/* [解密清理] 初始化函数（已完成解密） */\n/*${immediateFunctionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
                  path.replaceWithMultiple(parseCode(commentedCode).program.body);
                } else {
                  path.remove();
                }
                immediateFunctionCleanupCount++;
                
                if (config.verbose) {
                  console.log(`  [清理] ${cleanupMode === 'comment' ? '注释' : '删除'}立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
                }
              } else {
                if (config.verbose) {
                  console.log(`  [跳过] 立即执行函数在第 ${immediateFunctionLine} 行（在require之后）`);
                }
              }
            }
          }
        }
      });
    }

    if (functionCleanupCount > 0 || immediateFunctionCleanupCount > 0) {
      console.log(`  [清理完成] ${cleanupMode === 'comment' ? '注释' : '删除'}了 ${functionCleanupCount} 个第二类函数和 ${immediateFunctionCleanupCount} 个立即执行函数`);
    }

    const { code: newCode } = generate(ast);
    return newCode;
  } catch (error) {
    console.error(`清理函数失败: ${error.message}`);
    return code;
  }
}

module.exports = {
  applyCallExpressionReplacements,
  analyzeFunctionsForCleanup,
  cleanupDecryptedFunctions
};