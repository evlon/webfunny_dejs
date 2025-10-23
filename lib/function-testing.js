/**
 * 函数测试和执行模块
 * 负责生成测试代码、执行函数测试、处理字符串反序等
 */

const vm = require('vm');
const { extractFunctionName, extractConstantArguments, isInitializationFunction, parseCode, traverse, generate } = require('./ast-utils');

/**
 * 处理字符串反序：将'.split("").reverse().join("")'模式替换为实际字符串
 */
function processStringReverse(code, config) {
  // 正则表达式匹配："xxx".split("").reverse().join("")
  const pattern = /"([^"]*)"\.split\(""\)\.reverse\(\)\.join\(""\)/g;
  
  let replaceCount = 0;
  
  const processedCode = code.replace(pattern, (match, originalString) => {
    const reversedString = originalString.split('').reverse().join('');
    const replacement = `"${reversedString}"`;
    replaceCount++;
    
    if (config.verbose) {
      console.log(`  [字符串反序] ${originalString} -> ${reversedString}`);
    }
    
    return replacement;
  });
  
  if (config.verbose && replaceCount > 0) {
    console.log(`  [字符串反序] 替换了 ${replaceCount} 处字符串反序表达式`);
  }
  
  return processedCode;
}

/**
 * 预处理代码：只处理字符串反序，函数调用拦截在AST阶段处理
 */
function preprocessCode(code, config) {
  try {
    // 只处理字符串反序
    if (config.verbose) {
      console.log(`  [预处理] 处理字符串反序表达式...`);
    }
    let processedCode = processStringReverse(code, config);

    if (config.verbose) {
      console.log(`  [预处理] 字符串反序处理完成`);
    }

    return processedCode;
  } catch (error) {
    console.error('代码预处理失败:', error.message);
    return code;
  }
}

/**
 * 为函数代码添加简单的跟踪（调试模式）
 */
function instrumentFunctionWithTracing(functionCode, functionName, config) {
  if (!config.debug) {
    return functionCode; // 调试模式未启用，返回原始代码
  }
  
  try {
    // 使用更安全的方法：只在函数声明时添加跟踪
    // 对于函数声明：function f123() { ... }
    if (functionCode.startsWith('function')) {
      // 找到函数体的开始位置
      const bodyStart = functionCode.indexOf('{');
      if (bodyStart === -1) {
        return functionCode; // 无法找到函数体，返回原始代码
      }
      
      // 在函数体开始处插入跟踪代码
      const beforeBody = functionCode.substring(0, bodyStart + 1);
      const afterBody = functionCode.substring(bodyStart + 1);
      
      const traceCode = `
  // [TRACE] Function ${functionName} started
  if (typeof globalTraceLog !== 'undefined') {
    globalTraceLog.push({ type: 'func_start', func: '${functionName}' });
  }
  `;
      
      return beforeBody + traceCode + afterBody;
    }
    
    // 对于函数表达式：var f123 = function() { ... }
    if (functionCode.includes('= function')) {
      const bodyStart = functionCode.indexOf('{');
      if (bodyStart === -1) {
        return functionCode;
      }
      
      const beforeBody = functionCode.substring(0, bodyStart + 1);
      const afterBody = functionCode.substring(bodyStart + 1);
      
      const traceCode = `
  // [TRACE] Function ${functionName} started
  if (typeof globalTraceLog !== 'undefined') {
    globalTraceLog.push({ type: 'func_start', func: '${functionName}' });
  }
  `;
      
      return beforeBody + traceCode + afterBody;
    }
    
    return functionCode; // 不支持的函数格式，返回原始代码
  } catch (error) {
    if (config.verbose) {
      console.log(`  [警告] 函数 ${functionName} 跟踪代码插入失败: ${error.message}`);
    }
    return functionCode; // 出错时返回原始代码
  }
}

/**
 * 提取立即执行函数代码及其依赖
 */
function extractImmediateFunctions(code, config) {
  const immediateFunctions = [];
  const foundDependencies = new Set();
  
  try {
    const ast = parseCode(code);

    traverse(ast, {
      CallExpression(path) {
        // 检查是否是立即执行函数
        if (path.node.callee.type === 'FunctionExpression') {
          // 分析立即执行函数内部调用的函数
          traverse(path.node.callee, {
            CallExpression(innerPath) {
              const funcName = extractFunctionName(innerPath.node.callee);
              if (funcName && config.interceptPattern.test(funcName)) {
                foundDependencies.add(funcName);
                if (config.verbose) {
                  console.log(`  [立即函数依赖] 发现依赖函数: ${funcName}`);
                }
              }
            }
          }, path.scope);
          
          // 确保语法正确：添加必要的括号
          const functionExprCode = generate(path.node.callee).code;
          const argsCode = generate(path.node).code.substring(functionExprCode.length);
          
          // 正确包装： (function(){})()
          const immediateFunctionCode = `(${functionExprCode})${argsCode}`;
          immediateFunctions.push(immediateFunctionCode + ';');
          
          if (config.verbose) {
            console.log(`  [提取] 立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
          }
        }
      }
    });
  } catch (error) {
    if (config.verbose) {
      console.log(`  [警告] 提取立即执行函数失败: ${error.message}`);
    }
  }
  
  return {
    functions: immediateFunctions,
    dependencies: foundDependencies
  };
}

/**
 * 从源代码中提取实际的函数调用表达式
 */
function extractActualFunctionCalls(code, config, shouldInterceptFunction) {
  try {
    const ast = parseCode(code);

    const actualCalls = [];

    traverse(ast, {
      CallExpression(path) {
        const funcName = extractFunctionName(path.node.callee);
        
        if (funcName && config.interceptPattern.test(funcName)) {
          // 检查是否是初始化函数（应该跳过）
          if (isInitializationFunction(path)) {
            if (config.verbose) {
              console.log(`  [跳过] 初始化函数调用: ${funcName}(${path.node.arguments.length}参数)`);
            }
            return;
          }
          
          // 检查参数是否都是常量
          const args = extractConstantArguments(path.node.arguments);
          
            // 只有当所有参数都是常量时才记录
            const allConstants = args.every(arg => arg !== undefined);
            
            if (allConstants) {
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
                actualCalls.push({
                  callExpression: callExpression,
                  funcName: funcName,
                  args: args,
                  path: path
                });
              }
            }
        }
      },
      
      // // 处理对象属性中的函数调用
      // ObjectProperty(path) {
      //   if (path.node.value.type === 'CallExpression') {
      //     const funcName = extractFunctionName(path.node.value.callee);
          
      //     if (funcName && config.interceptPattern.test(funcName)) {
      //       // 检查是否是初始化函数（应该跳过）
      //       if (isInitializationFunction(path.get('value'))) {
      //         if (config.verbose) {
      //           console.log(`  [跳过] 初始化对象属性函数调用: ${funcName}(${path.node.value.arguments.length}参数)`);
      //         }
      //         return;
      //       }
            
      //       const args = extractConstantArguments(path.node.value.arguments);
      //       const allConstants = args.every(arg => arg !== undefined);
            
      //       if (allConstants) {
      //         const callExpression = path.node.value;
      //         actualCalls.push({
      //           callExpression: callExpression,
      //           funcName: funcName,
      //           args: args,
      //           path: path.get('value')
      //         });
      //       }
      //     }
      //   }
      // },
      
      // // 处理数组元素中的函数调用
      // ArrayExpression(path) {
      //   path.node.elements.forEach((element, index) => {
      //     if (element && element.type === 'CallExpression') {
      //       const funcName = extractFunctionName(element.callee);
            
      //       if (funcName && config.interceptPattern.test(funcName)) {
      //         // 检查是否是初始化函数（应该跳过）
      //         if (isInitializationFunction(path.get(`elements.${index}`))) {
      //           if (config.verbose) {
      //             console.log(`  [跳过] 初始化数组函数调用: ${funcName}(${element.arguments.length}参数)`);
      //           }
      //           return;
      //         }
              
      //         const args = extractConstantArguments(element.arguments);
      //         const allConstants = args.every(arg => arg !== undefined);
              
      //         if (allConstants) {
      //           const callExpression = element.toString();
      //           actualCalls.push({
      //             callExpression: callExpression,
      //             funcName: funcName,
      //             args: args,
      //             path: path.get(`elements.${index}`)
      //           });
      //         }
      //       }
      //     }
      //   });
      // },
      
      // // 处理赋值表达式中的函数调用
      // AssignmentExpression(path) {
      //   if (path.node.right.type === 'CallExpression') {
      //     const funcName = extractFunctionName(path.node.right.callee);
          
      //     if (funcName && config.interceptPattern.test(funcName)) {
      //       // 检查是否是初始化函数（应该跳过）
      //       if (isInitializationFunction(path.get('right'))) {
      //         if (config.verbose) {
      //           console.log(`  [跳过] 初始化赋值函数调用: ${funcName}(${path.node.right.arguments.length}参数)`);
      //         }
      //         return;
      //       }
            
      //       const args = extractConstantArguments(path.node.right.arguments);
      //       const allConstants = args.every(arg => arg !== undefined);
            
      //       if (allConstants) {
      //         const callExpression = path.node.right;
      //         actualCalls.push({
      //           callExpression: callExpression,
      //           funcName: funcName,
      //           args: args,
      //           path: path.get('right')
      //         });
      //       }
      //     }
      //   }
      // },
      
      // // 处理变量声明中的函数调用
      // VariableDeclarator(path) {
      //   if (path.node.init && path.node.init.type === 'CallExpression') {
      //     const funcName = extractFunctionName(path.node.init.callee);
          
      //     if (funcName && config.interceptPattern.test(funcName)) {
      //       // 检查是否是初始化函数（应该跳过）
      //       if (isInitializationFunction(path.get('init'))) {
      //         if (config.verbose) {
      //           console.log(`  [跳过] 初始化变量函数调用: ${funcName}(${path.node.init.arguments.length}参数)`);
      //         }
      //         return;
      //       }
            
      //       const args = extractConstantArguments(path.node.init.arguments);
      //       const allConstants = args.every(arg => arg !== undefined);
            
      //       if (allConstants) {
      //         const callExpression = path.node.init;
      //         actualCalls.push({
      //           callExpression: callExpression,
      //           funcName: funcName,
      //           args: args,
      //           path: path.get('init')
      //         });
      //       }
      //     }
      //   }
      // }
    });

    return actualCalls;
  } catch (error) {
    console.error('提取函数调用失败:', error.message);
    return [];
  }
}

/**
 * 创建执行上下文
 */
function createContext() {
  const context = {
    require: function (name) {
      if (config.verbose) console.log(`Require detected: ${name}`);
      return name;
    },
    module: { exports: {} },
    exports: {},
    console: console,
    process: {
      env: {},
      cwd: () => process.cwd(),
      exit: (code) => console.log(`[DEBUG] process.exit(${code}) called but ignored`),
      platform: process.platform,
    },
    eval: (code) => {
      try {
        return vm.runInContext(code, context);
      } catch (e) {
        if (config.verbose) console.error(`eval执行失败: ${e.message}`);
        return undefined;
      }
    },
    global: {},
    Buffer: Buffer,
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval,
    undefined: undefined
  };
  
  return vm.createContext(context);
}

module.exports = {
  processStringReverse,
  preprocessCode,
  instrumentFunctionWithTracing,
  extractImmediateFunctions,
  extractActualFunctionCalls,
  createContext
};