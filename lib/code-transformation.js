/**
 * 代码转换和清理模块
 * 负责应用函数调用替换、清理已解密的函数等
 */

const { extractFunctionName, shouldInterceptFunction, parseCode, traverse, generate, t } = require('./ast-utils');

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
                  replacementNode = t.stringLiteral(result);
                } else if (typeof result === 'number') {
                  replacementNode = t.numericLiteral(result);
                } else if (typeof result === 'boolean') {
                  replacementNode = t.booleanLiteral(result);
                } else if (result === null) {
                  replacementNode = t.nullLiteral();
                } else if (result === undefined) {
                  replacementNode = t.identifier('undefined');
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
 */
function cleanupDecryptedFunctions(code, cleanupData, cleanupMode, config) {
  const { functions: functionsToCleanup, immediateFunctions: immediateFunctionsToCleanup } = cleanupData;
  
  if ((functionsToCleanup.size === 0 && immediateFunctionsToCleanup.size === 0) || cleanupMode === 'none') {
    return code;
  }

  try {
    // 第一阶段：分析依赖关系
    const ast = parseCode(code);

    // 构建函数依赖图
    const dependencyGraph = new Map();
    const allFunctions = new Set();
    
    // 收集所有函数
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName) {
          allFunctions.add(funcName);
          dependencyGraph.set(funcName, new Set());
        }
      },
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName) {
            allFunctions.add(funcName);
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
        
        if (callerName && calleeName && allFunctions.has(calleeName)) {
          dependencyGraph.get(callerName)?.add(calleeName);
        }
      }
    });

    // 第二阶段：安全清理
    let functionCleanupCount = 0;
    let immediateFunctionCleanupCount = 0;

    // 1. 先清理立即执行函数（不会影响函数依赖）
    if (immediateFunctionsToCleanup.size > 0) {
      traverse(ast, {
        ExpressionStatement(path) {
          if (path.node.expression.type === 'CallExpression' && 
              path.node.expression.callee.type === 'FunctionExpression') {
            
            const immediateFunctionCode = generate(path.node).code;
            const immediateFunctionKey = `immediate_${Buffer.from(immediateFunctionCode).toString('base64').substring(0, 10)}`;
            
            if (immediateFunctionsToCleanup.has(immediateFunctionKey)) {
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
            }
          }
        }
      });
    }

    // 2. 按依赖顺序清理函数（从叶子节点开始）
    const safeToClean = new Set(functionsToCleanup);
    
    // 分析哪些函数被业务逻辑调用
    const protectedFunctions = new Set();
    let firstRequireLine = Infinity;
    
    // 首先找到第一个require的位置
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
          if (path.node.loc && path.node.loc.start.line < firstRequireLine) {
            firstRequireLine = path.node.loc.start.line;
          }
        }
      }
    });
    
    // 收集所有未被标记为清理的函数调用
    traverse(ast, {
      CallExpression(path) {
        const funcName = extractFunctionName(path.node.callee);
        if (funcName && allFunctions.has(funcName)) {
          // 检查调用上下文是否在非清理区域
          let isProtected = false;
          let current = path;
          
          while (current = current.parentPath) {
            // 如果在require之后的代码中
            if (current.node.loc && firstRequireLine !== Infinity && 
                current.node.loc.start.line > firstRequireLine) {
              isProtected = true;
              break;
            }
            
            // 如果在导出的函数中
            if (current.isExportNamedDeclaration() || current.isExportDefaultDeclaration()) {
              isProtected = true;
              break;
            }
            
            // 如果在非清理函数中
            if ((current.isFunctionDeclaration() || 
                 (current.isVariableDeclarator() && current.node.init?.type === 'FunctionExpression')) 
                && !functionsToCleanup.has(current.node.id?.name)) {
              isProtected = true;
              break;
            }
            
            // 如果到达程序顶层
            if (current.isProgram()) {
              break;
            }
          }
          
          if (isProtected) {
            protectedFunctions.add(funcName);
            
            // 保护整个调用链
            const visited = new Set();
            const stack = [funcName];
            
            while (stack.length > 0) {
              const current = stack.pop();
              if (!visited.has(current)) {
                visited.add(current);
                
                // 向上保护调用者
                for (const [caller, deps] of dependencyGraph) {
                  if (deps.has(current)) {
                    stack.push(caller);
                  }
                }
                
                // 向下保护依赖
                for (const dep of dependencyGraph.get(current) || []) {
                  stack.push(dep);
                }
              }
            }
          }
        }
      }
    });
    
    // 移除被保护函数及其依赖
    for (const func of protectedFunctions) {
      safeToClean.delete(func);
      
      // 保护这个函数的所有依赖
      const visited = new Set();
      const stack = [func];
      
      while (stack.length > 0) {
        const current = stack.pop();
        if (!visited.has(current)) {
          visited.add(current);
          safeToClean.delete(current);
          
          for (const dep of dependencyGraph.get(current) || []) {
            stack.push(dep);
          }
        }
      }
      
      if (config.verbose) {
        console.log(`  [业务保护] 保留函数 ${func} 及其依赖链`);
      }
    }

    // 实际执行函数清理
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && safeToClean.has(funcName)) {
          if (cleanupMode === 'comment') {
            const functionCode = generate(path.node).code;
            const commentedCode = `/* [解密清理] 已解密的函数: ${funcName} */\n/*${functionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
            path.replaceWithMultiple(parseCode(commentedCode).program.body);
          } else {
            path.remove();
          }
          functionCleanupCount++;
          
          if (config.verbose) {
            console.log(`  [清理] ${cleanupMode === 'comment' ? '注释' : '删除'}函数: ${funcName}`);
          }
        }
      },
      
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName && safeToClean.has(funcName)) {
            if (cleanupMode === 'comment') {
              const functionCode = generate(path.node).code;
              const commentedCode = `/* [解密清理] 已解密的函数表达式: ${funcName} */\n/*${functionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
              path.replaceWithMultiple(parseCode(commentedCode).program.body);
            } else {
              path.remove();
            }
            functionCleanupCount++;
            
            if (config.verbose) {
              console.log(`  [清理] ${cleanupMode === 'comment' ? '注释' : '删除'}函数表达式: ${funcName}`);
            }
          }
        }
      }
    });

    if (functionCleanupCount > 0 || immediateFunctionCleanupCount > 0) {
      console.log(`  [清理完成] ${cleanupMode === 'comment' ? '注释' : '删除'}了 ${functionCleanupCount} 个函数和 ${immediateFunctionCleanupCount} 个立即执行函数`);
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