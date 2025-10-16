#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// 命令行参数解析
const argv = yargs(hideBin(process.argv))
  .option('file', {
    alias: 'f',
    describe: '待处理的文件路径',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    describe: '输出文件路径（不指定则覆盖原文件）',
    type: 'string'
  })
  .option('backup', {
    alias: 'b',
    describe: '是否创建备份文件',
    type: 'boolean',
    default: true
  })
  .option('verbose', {
    alias: 'v',
    describe: '详细输出模式',
    type: 'boolean',
    default: false
  })
  .option('debug', {
    alias: 'd',
    describe: '调试模式，记录运行时变量状态用于对比分析',
    type: 'boolean',
    default: false
  })
  .option('trace-lines', {
    describe: '是否启用行级变量跟踪',
    type: 'boolean',
    default: true
  })
  .option('function-name', {
    describe: '指定要调试的函数名称（正则表达式）',
    type: 'string'
  })
  .option('output-debug', {
    describe: '调试日志输出文件',
    type: 'string'
  })
  .option('disable-replace', {
    describe: '禁用常量函数替换（仅执行调试）',
    type: 'boolean',
    default: false
  })
  .option('cleanup-functions', {
    describe: '实验性：清理已解密的函数（注释或删除）',
    type: 'string',
    choices: ['none', 'comment', 'remove'],
    default: 'none'
  })
  .option('string-reverse', {
    describe: '是否解密字符串反转表达式',
    type: 'boolean',
    default: true
  })
  .option('function-calls', {
    describe: '是否解密函数调用',
    type: 'boolean',
    default: true
  })
  .option('intercept-pattern', {
    describe: '函数名匹配模式（正则表达式）',
    type: 'string',
    default: 'f\\d*'
  })
  .option('min-args', {
    describe: '最小参数个数',
    type: 'number',
    default: 4
  })
  .option('max-args', {
    describe: '最大参数个数',
    type: 'number',
    default: 6
  })
  .help()
  .argv;

// 配置对象
const config = {
  decryptStringReverse: argv['string-reverse'],
  decryptFunctionCalls: argv['function-calls'],
  verbose: argv.verbose,
  debug: argv.debug,
  traceLines: argv['trace-lines'],
  outputDebug: argv['output-debug'],
  disableReplace: argv['disable-replace'],
  cleanupFunctions: argv['cleanup-functions'],
  interceptPattern: new RegExp(argv['intercept-pattern']),
  functionNamePattern: argv['function-name'] ? new RegExp(argv['function-name']) : null,
  minArgs: argv['min-args'],
  maxArgs: argv['max-args']
};

/**
 * 检查函数是否应该被处理
 */
function shouldInterceptFunction(funcName, argsCount) {
  // 如果有指定函数名称，先检查是否匹配
  if (config.functionNamePattern && !config.functionNamePattern.test(funcName)) {
    return false;
  }
  
  // 检查是否匹配拦截模式
  if (!config.interceptPattern.test(funcName)) {
    return false;
  }
  
  // 放宽参数数量限制：如果函数是重要依赖，即使参数数量不符合也要提取
  // 记录所有匹配拦截模式的函数，无论参数数量
  if (config.verbose && (argsCount < config.minArgs || argsCount > config.maxArgs)) {
    console.log(`  [放宽限制] 函数 ${funcName} 参数数量 ${argsCount} 不符合要求 (${config.minArgs}-${config.maxArgs})，但因为匹配模式仍被提取`);
  }
  
  return true;
}

/**
 * 处理字符串反序：将'.split("").reverse().join("")'模式替换为实际字符串
 */
function processStringReverse(code) {
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
 * @param {string} code - 原始代码
 * @returns {string} - 处理后的代码
 */
function preprocessCode(code) {
  try {
    // 只处理字符串反序
    if (config.verbose) {
      console.log(`  [预处理] 处理字符串反序表达式...`);
    }
    let processedCode = processStringReverse(code);

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
 * 收集初始化函数中调用的所有函数（包括嵌套依赖）
 * @param {string} code - 源代码
 * @returns {Set} - 初始化函数中调用的函数名集合
 */
function collectInitializationFunctionCalls(code) {
  const initializationCalls = new Set();
  
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

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

    // 递归分析依赖关系
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
 * 拓扑排序算法
 * @param {Map} graph - 依赖图，key为函数名，value为依赖的函数名集合
 * @returns {Array} - 拓扑排序后的函数名数组
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

/**
 * 提取匹配的函数定义（包含依赖关系）
 * @param {string} code - 源代码
 * @returns {Object} - 包含提取的函数代码和函数列表
 */
function extractFunctionDefinitions(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

    const allFunctions = [];
    const functionCodeMap = new Map();
    const functionNames = new Set();

    // 先收集所有匹配的函数，不限制参数数量（因为依赖关系更重要）
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && config.interceptPattern.test(funcName)) {
          allFunctions.push({
            name: funcName,
            node: path.node,
            type: 'declaration'
          });
          functionNames.add(funcName);
          if (config.verbose) {
            console.log(`  [收集] 函数声明: ${funcName}`);
          }
        }
      },
      
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName && config.interceptPattern.test(funcName)) {
            allFunctions.push({
              name: funcName,
              node: path.node,
              type: 'expression'
            });
            functionNames.add(funcName);
            if (config.verbose) {
              console.log(`  [收集] 函数表达式: ${funcName}`);
            }
          }
        }
      }
    });

    // 收集初始化函数中调用的函数
    const initializationCalls = collectInitializationFunctionCalls(code);
    
    // 收集立即执行函数中的依赖
    const immediateFunctionsData = extractImmediateFunctions(code);
    const immediateDependencies = immediateFunctionsData.dependencies;
    
// 合并所有依赖
const allDependencies = new Set([...initializationCalls, ...immediateDependencies]);

if (config.verbose && allDependencies.size > 0) {
  console.log(`  [依赖汇总] 发现的总依赖函数: ${Array.from(allDependencies).join(', ')}`);
}

// 确保所有依赖函数都被提取（即使它们自身可能不符合拦截模式）
traverse(ast, {
  FunctionDeclaration(path) {
    const funcName = path.node.id?.name;
    if (funcName && allDependencies.has(funcName) && !functionNames.has(funcName)) {
      allFunctions.push({
        name: funcName,
        node: path.node,
        type: 'declaration'
      });
      functionNames.add(funcName);
      if (config.verbose) {
        console.log(`  [补充提取] 依赖函数声明: ${funcName}`);
      }
    }
  },
  
  VariableDeclarator(path) {
    if (path.node.init && path.node.init.type === 'FunctionExpression') {
      const funcName = path.node.id?.name;
      if (funcName && allDependencies.has(funcName) && !functionNames.has(funcName)) {
        allFunctions.push({
          name: funcName,
          node: path.node,
          type: 'expression'
        });
        functionNames.add(funcName);
        if (config.verbose) {
          console.log(`  [补充提取] 依赖函数表达式: ${funcName}`);
        }
      }
    }
  }
});

// 额外提取：即使函数不符合拦截模式，但如果被其他函数调用，也应该被提取
// 这是为了处理像 f() 这样参数数量不符合要求但被依赖的函数
traverse(ast, {
  CallExpression(path) {
    const funcName = extractFunctionName(path.node.callee);
    if (funcName && !functionNames.has(funcName) && !allDependencies.has(funcName)) {
      // 如果这个函数被其他函数调用，但没有被提取，检查它是否定义在代码中
      if (config.interceptPattern.test(funcName)) {
        // 即使参数数量不符合要求，但因为是关键依赖，也应该提取
        if (config.verbose) {
          console.log(`  [关键依赖] 函数 ${funcName} 被调用但未提取，检查是否定义`);
        }
      }
    }
  }
});

    // 简单策略：先提取所有函数定义，按发现的顺序
    const extractedFunctions = [];
    
    allFunctions.forEach(funcInfo => {
      let functionCode;
      if (funcInfo.type === 'declaration') {
        functionCode = generate(funcInfo.node).code;
      } else {
        functionCode = generate(funcInfo.node).code;
      }
      
      extractedFunctions.push(funcInfo.name);
      functionCodeMap.set(funcInfo.name, functionCode);
      
      if (config.verbose) {
        console.log(`  [提取] ${funcInfo.type === 'declaration' ? '函数' : '函数表达式'}: ${funcInfo.name}`);
      }
    });
    
    if (config.verbose && extractedFunctions.length > 0) {
      console.log(`  [提取完成] 共提取 ${extractedFunctions.length} 个函数: ${extractedFunctions.join(', ')}`);
    }

    return {
      functions: extractedFunctions,
      functionCodeMap: functionCodeMap
    };
  } catch (error) {
    console.error('函数提取失败:', error.message);
    return { functions: [], functionCodeMap: new Map() };
  }
}

/**
 * 检查参数是否都是常量
 * @param {Array} arguments - AST参数节点数组
 * @returns {Array} - 常量参数值数组（包含undefined表示非常量）
 */
function extractConstantArguments(arguments) {
  return arguments.map(arg => {
    if (arg.type === 'StringLiteral') return arg.value;
    if (arg.type === 'NumericLiteral') return arg.value;
    if (arg.type === 'BooleanLiteral') return arg.value;
    if (arg.type === 'NullLiteral') return null;
    if (arg.type === 'Identifier' && arg.name === 'undefined') return undefined;
    if (arg.type === 'UnaryExpression' && arg.operator === '-') {
      // 处理负号表达式：-123
      if (arg.argument.type === 'NumericLiteral') {
        return -arg.argument.value;
      }
    }
    return undefined; // 非常量参数
  });
}

/**
 * 检查是否是初始化函数调用（应该跳过）
 * @param {Object} path - AST路径
 * @returns {boolean} - 是否是初始化函数
 */
function isInitializationFunction(path) {
  // 检查是否是立即执行函数表达式（IIFE）
  if (path.parentPath && 
      path.parentPath.node.type === 'CallExpression' && 
      path.parentPath.node.callee.type === 'FunctionExpression') {
    return true;
  }
  
  // 检查父级上下文：如果在立即执行函数内部
  let parent = path.parentPath;
  while (parent) {
    if (parent.node.type === 'CallExpression' && 
        parent.node.callee.type === 'FunctionExpression') {
      return true;
    }
    parent = parent.parentPath;
  }
  
  // 检查是否在do-while循环中（典型的初始化模式）
  if (path.findParent(p => p.isDoWhileStatement())) {
    return true;
  }
  
  // 检查是否在try-catch块中（常见的初始化错误处理）
  if (path.findParent(p => p.isTryStatement())) {
    return true;
  }
  
  return false;
}

/**
 * 提取立即执行函数代码及其依赖
 * @param {string} code - 源代码
 * @returns {Object} - 包含立即执行函数代码和发现的依赖函数集合
 */
function extractImmediateFunctions(code) {
  const immediateFunctions = [];
  const foundDependencies = new Set();
  
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

    traverse(ast, {
      ExpressionStatement(path) {
        // 检查是否是立即执行函数表达式语句
        if (path.node.expression.type === 'CallExpression' && 
            path.node.expression.callee.type === 'FunctionExpression') {
          
          // 分析立即执行函数内部调用的函数
          traverse(path.node.expression.callee, {
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
          
          // 直接使用完整的表达式语句
          const immediateFunctionCode = generate(path.node).code;
          immediateFunctions.push(immediateFunctionCode);
          
          if (config.verbose) {
            console.log(`  [提取] 立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
          }
        }
      },
      
      CallExpression(path) {
        // 检查是否是立即执行函数（可能在复杂表达式中）
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
            console.log(`  [提取] 立即执行函数(包装): ${immediateFunctionCode.substring(0, 100)}...`);
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
 * 为函数代码添加简单的跟踪（调试模式）
 * @param {string} functionCode - 原始函数代码
 * @param {string} functionName - 函数名称
 * @returns {string} - 添加了跟踪代码的函数
 */
function instrumentFunctionWithTracing(functionCode, functionName) {
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
 * 从AST节点提取函数名
 * @param {Object} callee - AST调用表达式节点
 * @returns {string|null} - 函数名
 */
function extractFunctionName(callee) {
  if (callee.type === 'Identifier') {
    // 直接标识符调用: f123(...)
    return callee.name;
  } else if (callee.type === 'MemberExpression') {
    // 成员表达式调用: obj.f123(...) 或 this.f123(...)
    if (callee.property.type === 'Identifier') {
      const propertyName = callee.property.name;
      
      // 检查是否是 JavaScript 保留关键字
      const reservedKeywords = ['default', 'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'this', 'typeof', 'instanceof', 'new', 'delete', 'void', 'in', 'try', 'catch', 'finally', 'throw', 'class', 'extends', 'super', 'import', 'export', 'null', 'true', 'false', 'undefined', 'NaN', 'Infinity'];
      
      if (reservedKeywords.includes(propertyName)) {
        // 对于保留关键字，返回 null 表示不处理这种调用
        return null;
      }
      
      return propertyName;
    }
  }
  return null;
}

/**
 * 从源代码中提取实际的函数调用表达式
 * @param {string} code - 源代码
 * @returns {Array} - 函数调用表达式列表
 */
function extractActualFunctionCalls(code) {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

    const actualCalls = [];

    traverse(ast, {
      CallExpression(path) {
        const funcName = extractFunctionName(path.node.callee);
        
        if (funcName && shouldInterceptFunction(funcName, path.node.arguments.length)) {
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
            const callExpression = path.toString();
            actualCalls.push({
              callExpression: callExpression,
              funcName: funcName,
              args: args,
              path: path
            });
          }
        }
      },
      
      // 处理对象属性中的函数调用
      ObjectProperty(path) {
        if (path.node.value.type === 'CallExpression') {
          const funcName = extractFunctionName(path.node.value.callee);
          
          if (funcName && shouldInterceptFunction(funcName, path.node.value.arguments.length)) {
            // 检查是否是初始化函数（应该跳过）
            if (isInitializationFunction(path.get('value'))) {
              if (config.verbose) {
                console.log(`  [跳过] 初始化对象属性函数调用: ${funcName}(${path.node.value.arguments.length}参数)`);
              }
              return;
            }
            
            const args = extractConstantArguments(path.node.value.arguments);
            const allConstants = args.every(arg => arg !== undefined);
            
            if (allConstants) {
              const callExpression = path.node.value.toString();
              actualCalls.push({
                callExpression: callExpression,
                funcName: funcName,
                args: args,
                path: path.get('value')
              });
            }
          }
        }
      },
      
      // 处理数组元素中的函数调用
      ArrayExpression(path) {
        path.node.elements.forEach((element, index) => {
          if (element && element.type === 'CallExpression') {
            const funcName = extractFunctionName(element.callee);
            
            if (funcName && shouldInterceptFunction(funcName, element.arguments.length)) {
              // 检查是否是初始化函数（应该跳过）
              if (isInitializationFunction(path.get(`elements.${index}`))) {
                if (config.verbose) {
                  console.log(`  [跳过] 初始化数组函数调用: ${funcName}(${element.arguments.length}参数)`);
                }
                return;
              }
              
              const args = extractConstantArguments(element.arguments);
              const allConstants = args.every(arg => arg !== undefined);
              
              if (allConstants) {
                const callExpression = element.toString();
                actualCalls.push({
                  callExpression: callExpression,
                  funcName: funcName,
                  args: args,
                  path: path.get(`elements.${index}`)
                });
              }
            }
          }
        });
      },
      
      // 处理赋值表达式中的函数调用
      AssignmentExpression(path) {
        if (path.node.right.type === 'CallExpression') {
          const funcName = extractFunctionName(path.node.right.callee);
          
          if (funcName && shouldInterceptFunction(funcName, path.node.right.arguments.length)) {
            // 检查是否是初始化函数（应该跳过）
            if (isInitializationFunction(path.get('right'))) {
              if (config.verbose) {
                console.log(`  [跳过] 初始化赋值函数调用: ${funcName}(${path.node.right.arguments.length}参数)`);
              }
              return;
            }
            
            const args = extractConstantArguments(path.node.right.arguments);
            const allConstants = args.every(arg => arg !== undefined);
            
            if (allConstants) {
              const callExpression = path.node.right.toString();
              actualCalls.push({
                callExpression: callExpression,
                funcName: funcName,
                args: args,
                path: path.get('right')
              });
            }
          }
        }
      },
      
      // 处理变量声明中的函数调用
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'CallExpression') {
          const funcName = extractFunctionName(path.node.init.callee);
          
          if (funcName && shouldInterceptFunction(funcName, path.node.init.arguments.length)) {
            // 检查是否是初始化函数（应该跳过）
            if (isInitializationFunction(path.get('init'))) {
              if (config.verbose) {
                console.log(`  [跳过] 初始化变量函数调用: ${funcName}(${path.node.init.arguments.length}参数)`);
              }
              return;
            }
            
            const args = extractConstantArguments(path.node.init.arguments);
            const allConstants = args.every(arg => arg !== undefined);
            
            if (allConstants) {
              const callExpression = path.node.init.toString();
              actualCalls.push({
                callExpression: callExpression,
                funcName: funcName,
                args: args,
                path: path.get('init')
              });
            }
          }
        }
      }
    });

    return actualCalls;
  } catch (error) {
    console.error('提取函数调用失败:', error.message);
    return [];
  }
}

/**
 * 生成函数测试代码，基于实际的函数调用
 * @param {Map} functionCodeMap - 函数代码映射
 * @param {Array} actualCalls - 实际的函数调用列表
 * @param {string} originalCode - 原始代码（用于提取立即执行函数）
 * @returns {string} - 测试代码
 */
function generateFunctionTestCode(functionCodeMap, actualCalls, originalCode) {
  let testCode = `
// 测试环境设置
const originalConsoleLog = console.log;
console.log = () => {}; // 静默console.log

// 安全的函数包装器
function safeCall(func, args, callStr) {
  const startTime = Date.now();
  try {
    const result = func(...args);
    const elapsedTime = Date.now() - startTime;
    
    // 记录调用结果
    if (typeof globalResults !== 'undefined') {
      globalResults.set(callStr, result);
    }
    
    // 记录调用信息（调试模式）
    if (typeof globalCallLog !== 'undefined') {
      globalCallLog.push({
        call: callStr,
        args: args,
        result: result,
        timestamp: Date.now(),
        elapsedTime: elapsedTime
      });
    }
    
    // 立即输出日志，避免死循环时看不到进度
    console.log('[执行成功] ' + callStr + ' -> ' + JSON.stringify(result) + ' (' + elapsedTime + 'ms)');
    
    return true;
  } catch (e) {
    const elapsedTime = Date.now() - startTime;
    
    // 记录错误信息（调试模式）
    if (typeof globalCallLog !== 'undefined') {
      globalCallLog.push({
        call: callStr,
        args: args,
        error: e.message,
        timestamp: Date.now(),
        elapsedTime: elapsedTime
      });
    }
    
    // 立即输出错误日志，避免死循环时看不到进度
    console.log('[执行失败] ' + callStr + ' -> ' + e.message + ' (' + elapsedTime + 'ms)');
    if (e.stack) {
      console.log('[错误堆栈] ' + e.stack.substring(0, 500));
    }
    
    return false;
  }
}
`;

  // 添加立即执行函数到测试环境中（在函数定义之前执行）
  const immediateFunctionsData = extractImmediateFunctions(originalCode);
  if (immediateFunctionsData.functions.length > 0) {
    testCode += '\n// 执行立即函数（初始化环境）\n';
    immediateFunctionsData.functions.forEach((immediateFunc, index) => {
      testCode += `
// 立即执行函数 ${index + 1}
${immediateFunc}
`;
    });
    testCode += '\n';
    
    // 记录立即执行函数中发现的依赖
    if (immediateFunctionsData.dependencies.size > 0 && config.verbose) {
      console.log(`  [立即函数依赖] 发现的依赖函数: ${Array.from(immediateFunctionsData.dependencies).join(', ')}`);
    }
  }

  // 添加所有函数定义（可能包含跟踪代码）
  functionCodeMap.forEach((code, funcName) => {
    // 如果启用调试模式，为函数添加跟踪代码
    let finalCode = code;
    if (config.debug && config.traceLines) {
      finalCode = instrumentFunctionWithTracing(code, funcName);
    }
    testCode += finalCode + '\n';
  });

  // 生成基于实际调用的测试代码
  testCode += `
// 测试实际的函数调用
function testActualCalls() {
  let successCount = 0;
  let failCount = 0;
  
  ${actualCalls.map(call => {
    // 正确转义调用表达式中的双引号
    const escapedCallExpression = call.callExpression.replace(/"/g, '\\"');
    const argsString = JSON.stringify(call.args);
    
    return `
  // 测试调用: ${call.callExpression}
  if (typeof ${call.funcName} === 'function') {
    if (safeCall(${call.funcName}, ${argsString}, "${escapedCallExpression}")) {
      successCount++;
    } else {
      failCount++;
    }
  } else {
    console.log("函数 ${call.funcName} 不存在");
    failCount++;
  }
  `;
  }).join('\n')}
  
  // 恢复console.log用于调试输出
  console.log = originalConsoleLog;
  console.log("测试完成: 成功", successCount, "失败", failCount);
}

// 执行测试
console.log("=== 开始执行测试代码 ===");
console.log('总共需要测试 ${actualCalls.length} 个函数调用');

const testStartTime = Date.now();
try {
  testActualCalls();
  const testElapsedTime = Date.now() - testStartTime;
  console.log('=== 测试执行完成 (' + testElapsedTime + 'ms) ===');
} catch (e) {
  const testElapsedTime = Date.now() - testStartTime;
  console.log('=== 测试执行出错 (' + testElapsedTime + 'ms) ===');
  console.log("测试执行出错:", e.message);
  if (e.stack) {
    console.log("测试错误堆栈:", e.stack);
  }
}
`;

  return testCode;
}



/**
 * 应用基于调用表达式的替换（新方案）
 * @param {string} code - 原始代码
 * @param {Map} callExpressionMap - 调用表达式到结果的映射
 * @returns {string} - 替换后的代码
 */
function applyCallExpressionReplacements(code, callExpressionMap) {
  // 如果禁用替换，直接返回原始代码
  if (config.disableReplace || callExpressionMap.size === 0) {
    return code;
  }

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

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
          if (shouldInterceptFunction(funcName, path.node.arguments.length)) {
            const callExpression = path.toString();
            
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
 * @param {string} code - 源代码
 * @param {Map} callExpressionMap - 调用表达式到结果的映射
 * @param {Array} actualCalls - 实际调用列表
 * @returns {Object} - 返回可以清理的函数和立即执行函数
 */
function analyzeFunctionsForCleanup(code, callExpressionMap, actualCalls) {
  const functionsToCleanup = new Set();
  const immediateFunctionsToCleanup = new Set();
  
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

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
      
      // 如果函数只被常量函数调用且引用次数少，可以考虑清理
      if (isOnlyCalledByConstants && referenceCount <= actualCalls.filter(call => call.funcName === funcName).length) {
        functionsToCleanup.add(funcName);
        if (config.verbose) {
          console.log(`  [清理分析] 可以清理的函数: ${funcName} (引用次数: ${referenceCount})`);
        }
      }
    }

    // 分析立即执行函数是否可以清理
    // 简化逻辑：如果立即执行函数中调用的函数都已经被替换，就可以清理
    const immediateFunctionCallsToCheck = new Map();
    
    // 收集所有立即执行函数
    traverse(ast, {
      ExpressionStatement(path) {
        if (path.node.expression.type === 'CallExpression' && 
            path.node.expression.callee.type === 'FunctionExpression') {
          
          const immediateFunctionCode = generate(path.node).code;
          const immediateFunctionKey = `immediate_${Buffer.from(immediateFunctionCode).toString('base64').substring(0, 10)}`;
          
          // 检查这个立即执行函数中是否还有未替换的函数调用
          let hasUnreplacedCalls = false;
          
          // 遍历立即执行函数内部的调用
          traverse(path.node.expression.callee, {
            CallExpression(innerPath) {
              const funcName = extractFunctionName(innerPath.node.callee);
              if (funcName && config.interceptPattern.test(funcName)) {
                // 检查这个调用是否已经被替换
                const callExpression = innerPath.toString();
                if (!callExpressionMap.has(callExpression)) {
                  hasUnreplacedCalls = true;
                  if (config.verbose) {
                    console.log(`  [清理分析] 立即执行函数中还有未替换的调用: ${callExpression}`);
                  }
                }
              }
            }
          });
          
          // 如果没有未替换的调用，就可以清理这个立即执行函数
          if (!hasUnreplacedCalls) {
            immediateFunctionsToCleanup.add(immediateFunctionKey);
            if (config.verbose) {
              console.log(`  [清理分析] 可以清理的立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
            }
          }
        }
      }
    });
    
    if (shouldCleanupImmediateFunctions) {
      // 收集所有立即执行函数
      traverse(ast, {
        ExpressionStatement(path) {
          if (path.node.expression.type === 'CallExpression' && 
              path.node.expression.callee.type === 'FunctionExpression') {
            const immediateFunctionCode = generate(path.node).code;
            const immediateFunctionKey = `immediate_${Buffer.from(immediateFunctionCode).toString('base64').substring(0, 10)}`;
            immediateFunctionsToCleanup.add(immediateFunctionKey);
            if (config.verbose) {
              console.log(`  [清理分析] 可以清理的立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
            }
          }
        }
      });
    }

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
 * @param {string} code - 源代码
 * @param {Object} cleanupData - 清理数据
 * @param {string} cleanupMode - 清理模式：comment 或 remove
 * @returns {string} - 清理后的代码
 */
function cleanupDecryptedFunctions(code, cleanupData, cleanupMode) {
  const { functions: functionsToCleanup, immediateFunctions: immediateFunctionsToCleanup } = cleanupData;
  
  if ((functionsToCleanup.size === 0 && immediateFunctionsToCleanup.size === 0) || cleanupMode === 'none') {
    return code;
  }

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true
    });

    let functionCleanupCount = 0;
    let immediateFunctionCleanupCount = 0;

    // 清理普通函数
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name;
        if (funcName && functionsToCleanup.has(funcName)) {
          if (cleanupMode === 'comment') {
            // 注释掉函数
            const functionCode = generate(path.node).code;
            const commentedCode = `/* [解密清理] 已解密的函数: ${funcName} */\n/*${functionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
            
            path.replaceWithMultiple(parser.parse(commentedCode).program.body);
            functionCleanupCount++;
            
            if (config.verbose) {
              console.log(`  [清理] 注释函数: ${funcName}`);
            }
          } else if (cleanupMode === 'remove') {
            // 删除函数
            path.remove();
            functionCleanupCount++;
            
            if (config.verbose) {
              console.log(`  [清理] 删除函数: ${funcName}`);
            }
          }
        }
      },
      
      VariableDeclarator(path) {
        if (path.node.init && path.node.init.type === 'FunctionExpression') {
          const funcName = path.node.id?.name;
          if (funcName && functionsToCleanup.has(funcName)) {
            if (cleanupMode === 'comment') {
              // 注释掉函数表达式
              const functionCode = generate(path.node).code;
              const commentedCode = `/* [解密清理] 已解密的函数表达式: ${funcName} */\n/*${functionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
              
              path.replaceWithMultiple(parser.parse(commentedCode).program.body);
              functionCleanupCount++;
              
              if (config.verbose) {
                console.log(`  [清理] 注释函数表达式: ${funcName}`);
              }
            } else if (cleanupMode === 'remove') {
              // 删除函数表达式
              path.remove();
              functionCleanupCount++;
              
              if (config.verbose) {
                console.log(`  [清理] 删除函数表达式: ${funcName}`);
              }
            }
          }
        }
      }
    });

    // 清理立即执行函数
    if (immediateFunctionsToCleanup.size > 0) {
      traverse(ast, {
        ExpressionStatement(path) {
          if (path.node.expression.type === 'CallExpression' && 
              path.node.expression.callee.type === 'FunctionExpression') {
            
            const immediateFunctionCode = generate(path.node).code;
            const immediateFunctionKey = `immediate_${Buffer.from(immediateFunctionCode).toString('base64').substring(0, 10)}`;
            
            if (immediateFunctionsToCleanup.has(immediateFunctionKey)) {
              if (cleanupMode === 'comment') {
                // 注释掉立即执行函数
                const commentedCode = `/* [解密清理] 初始化函数（已完成解密） */\n/*${immediateFunctionCode.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/')}*/`;
                
                path.replaceWithMultiple(parser.parse(commentedCode).program.body);
                immediateFunctionCleanupCount++;
                
                if (config.verbose) {
                  console.log(`  [清理] 注释立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
                }
              } else if (cleanupMode === 'remove') {
                // 删除立即执行函数
                path.remove();
                immediateFunctionCleanupCount++;
                
                if (config.verbose) {
                  console.log(`  [清理] 删除立即执行函数: ${immediateFunctionCode.substring(0, 100)}...`);
                }
              }
            }
          }
        }
      });
    }

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

/**
 * 分析函数调用差异
 * @param {Array} callLog - 函数调用日志
 * @param {Array} actualCalls - 实际调用列表
 */
function analyzeFunctionCallDifferences(callLog, actualCalls) {
  if (callLog.length === 0) {
    console.log(`  [分析] 未收集到函数调用数据`);
    return;
  }
  
  console.log(`\n  [函数调用分析] 调用结果统计:`);
  const funcStats = {};
  
  callLog.forEach(call => {
    const funcName = call.call.split('(')[0];
    if (!funcStats[funcName]) {
      funcStats[funcName] = { success: 0, error: 0, results: [] };
    }
    
    if (call.error) {
      funcStats[funcName].error++;
      console.log(`    [错误] ${call.call} -> ${call.error}`);
    } else {
      funcStats[funcName].success++;
      funcStats[funcName].results.push(call.result);
      
      if (config.verbose) {
        console.log(`    [成功] ${call.call} -> ${JSON.stringify(call.result)}`);
      }
    }
  });
  
  // 统计每个函数的结果
  Object.entries(funcStats).forEach(([funcName, stats]) => {
    console.log(`\n    ${funcName}:`);
    console.log(`      成功调用: ${stats.success} 次`);
    console.log(`      失败调用: ${stats.error} 次`);
    
    // 分析返回值差异
    if (stats.results.length > 1) {
      const uniqueResults = [...new Set(stats.results.map(r => JSON.stringify(r)))];
      if (uniqueResults.length > 1) {
        console.log(`      [注意] 不同调用返回了不同结果:`);
        uniqueResults.forEach((result, index) => {
          console.log(`        结果 ${index + 1}: ${result}`);
        });
      }
    }
  });
  
  // 显示实际调用与执行调用的对比
  console.log(`\n  [调用对比] 预期调用 ${actualCalls.length} 次, 实际执行 ${callLog.length} 次`);
  if (actualCalls.length !== callLog.length) {
    console.log(`    [警告] 调用次数不匹配！可能的原因:`);
    console.log(`      - 函数依赖缺失`);
    console.log(`      - 函数执行错误`);
    console.log(`      - 函数定义不完整`);
  }
}

/**
 * 保存调试日志到文件
 * @param {Array} callLog - 函数调用日志
 * @param {string} outputPath - 输出文件路径
 */
function saveDebugLogs(callLog, outputPath) {
  try {
    const debugData = {
      timestamp: new Date().toISOString(),
      callLog: callLog,
      summary: {
        totalCalls: callLog.length,
        successfulCalls: callLog.filter(call => !call.error).length,
        failedCalls: callLog.filter(call => call.error).length
      }
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(debugData, null, 2), 'utf-8');
    console.log(`  [调试日志] 已保存到: ${outputPath}`);
  } catch (error) {
    console.log(`  [警告] 调试日志保存失败: ${error.message}`);
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

/**
 * 使用新方案处理（基于函数提取和实际调用替换）
 */
function processWithNewStrategy(sourceCode, outputPath) {
  console.log(`\n[新方案] 使用函数提取和实际调用替换方案...`);
  
  // 预处理代码：只处理字符串反序
  console.log(`[Step 1] 预处理代码，处理字符串反序...`);
  let processedCode = preprocessCode(sourceCode);

  // 提取函数定义
  console.log(`[Step 2] 提取匹配的函数定义...`);
  const { functions: extractedFunctions, functionCodeMap } = extractFunctionDefinitions(processedCode);
  
  if (extractedFunctions.length === 0) {
    console.log(`  [Info] 未找到匹配的函数定义，使用原有方案`);
    return null;
  }
  
  console.log(`  [提取完成] 找到 ${extractedFunctions.length} 个函数: ${extractedFunctions.join(', ')}`);
  
  // 提取实际的函数调用
  console.log(`[Step 3] 提取实际的函数调用...`);
  const actualCalls = extractActualFunctionCalls(processedCode);
  
  if (actualCalls.length === 0) {
    console.log(`  [Info] 未找到实际的常量函数调用`);
    
    // 调试：检查为什么没有找到调用
    if (config.verbose) {
      console.log(`  [调试] 检查函数调用提取问题...`);
      // 临时：添加一些调试输出
      const debugAst = parser.parse(processedCode, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true
      });
      
      let debugCallCount = 0;
      traverse(debugAst, {
        CallExpression(path) {
          debugCallCount++;
          const funcName = extractFunctionName(path.node.callee);
          if (funcName && config.interceptPattern.test(funcName)) {
            console.log(`    [调试] 找到匹配函数调用: ${funcName}(${path.node.arguments.length}参数)`);
            const args = extractConstantArguments(path.node.arguments);
            console.log(`      参数: ${args.map(a => JSON.stringify(a)).join(', ')}`);
            console.log(`      所有常量: ${args.every(a => a !== undefined)}`);
          }
        }
      });
      console.log(`    [调试] 总共找到 ${debugCallCount} 个函数调用`);
    }
    
    return null;
  }
  
  console.log(`  [提取完成] 找到 ${actualCalls.length} 个常量函数调用`);
  
  if (config.verbose) {
    console.log(`  [调试] 前10个调用:`);
    let count = 0;
    for (const call of actualCalls) {
      if (count++ >= 10) break;
      console.log(`    ${call.callExpression}`);
    }
  }
  
  // 生成函数测试代码（基于实际调用）
  console.log(`[Step 4] 生成函数测试代码...`);
  
  // 提取立即执行函数
  const immediateFunctions = extractImmediateFunctions(sourceCode);
  if (immediateFunctions.length > 0) {
    console.log(`  [提取] 找到 ${immediateFunctions.length} 个立即执行函数`);
  }
  
  const testCode = generateFunctionTestCode(functionCodeMap, actualCalls, sourceCode);
  
  // 保存测试代码用于调试
  if (config.verbose) {
    fs.writeFileSync(outputPath+".test.tmp.js", testCode, 'utf-8');
    console.log("测试代码保存:", outputPath+".test.tmp.js");
    console.log("测试代码内容预览:", testCode.substring(0, 500) + "...");
  }
  
  // 在VM中执行测试代码
  console.log(`[Step 5] 在VM中执行测试代码，获取调用结果...`);
  
  // 创建全局的跟踪和结果存储
  const globalResults = new Map();
  const globalTraceLog = [];
  const globalCallLog = [];
  
  // 创建VM上下文
  const context = vm.createContext({
    console: console,
    Map: Map,
    globalResults: globalResults, // 注入全局结果对象
    globalTraceLog: globalTraceLog, // 注入变量跟踪日志
    globalCallLog: globalCallLog, // 注入函数调用日志
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Date: Date
  });
  
  let callExpressionMap;
  const vmStartTime = Date.now();
  try {
    // 设置执行超时保护
    const maxExecutionTime = 30000; // 30秒超时
    const timeoutId = setTimeout(() => {
      throw new Error(`VM执行超时 (${maxExecutionTime}ms)`);
    }, maxExecutionTime);
    
    // 执行测试代码
    vm.runInContext(testCode, context);
    
    // 清除超时计时器
    clearTimeout(timeoutId);
    
    // 获取结果
    callExpressionMap = globalResults;
    
    const vmElapsedTime = Date.now() - vmStartTime;
    console.log('  [VM执行] 完成 (' + vmElapsedTime + 'ms)');
    
  } catch (error) {
    const vmElapsedTime = Date.now() - vmStartTime;
    console.log('  [错误] 测试代码执行失败 (' + vmElapsedTime + 'ms): ' + error.message);
    
    if (config.verbose) {
      console.log(`  [调试] 错误堆栈:`, error.stack);
      
      // 保存测试代码用于调试
      if (config.outputDebug) {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          elapsedTime: vmElapsedTime,
          testCode: testCode.substring(0, 10000) // 保存前10000字符
        };
        fs.writeFileSync(config.outputDebug + '.vm-error.json', JSON.stringify(debugInfo, null, 2), 'utf-8');
      }
    }
    
    return null;
  }
  
  console.log(`  [测试完成] 收集到 ${callExpressionMap.size} 个调用结果`);
  
  // 输出调试结果
  if (config.debug) {
    console.log(`\n  [调试信息] 函数调用记录: ${globalCallLog.length} 条`);
    
    // 分析函数调用差异
    analyzeFunctionCallDifferences(globalCallLog, actualCalls);
    
    // 保存调试日志到文件
    if (config.outputDebug) {
      saveDebugLogs(globalCallLog, config.outputDebug);
    }
  }
  
  if (callExpressionMap.size === 0) {
    console.log(`  [警告] 调用结果为空，可能原因:`);
    console.log(`    - 函数调用执行失败`);
    console.log(`    - 函数依赖关系不完整`);
    console.log(`    - 测试代码语法错误`);
    
    if (config.verbose) {
      console.log(`  [调试] 检查测试代码语法...`);
      // 验证测试代码语法
      try {
        parser.parse(testCode, { sourceType: 'script' });
        console.log(`    [调试] 测试代码语法正确`);
      } catch (e) {
        console.log(`    [调试] 测试代码语法错误: ${e.message}`);
      }
    }
  }
  
  if (config.verbose && callExpressionMap.size > 0) {
    console.log(`  [调试] 调用结果:`);
    let count = 0;
    for (const [callExpr, result] of callExpressionMap) {
      if (count++ >= 10) break;
      console.log(`    ${callExpr} -> ${JSON.stringify(result)}`);
    }
  }
  
  // 应用基于调用表达式的替换
  console.log(`[Step 6] 应用调用表达式替换...`);
  let finalCode = applyCallExpressionReplacements(processedCode, callExpressionMap);
  
  // 实验性：清理已解密的函数
  if (config.cleanupFunctions !== 'none') {
    console.log(`[Step 7] 分析并清理已解密的函数...`);
    
    // 分析哪些函数可以被清理
    const cleanupData = analyzeFunctionsForCleanup(finalCode, callExpressionMap, actualCalls);
    
    const totalCleanup = cleanupData.functions.size + cleanupData.immediateFunctions.size;
    if (totalCleanup > 0) {
      if (cleanupData.functions.size > 0) {
        console.log(`  [清理分析] 找到 ${cleanupData.functions.size} 个可以清理的函数: ${Array.from(cleanupData.functions).join(', ')}`);
      }
      if (cleanupData.immediateFunctions.size > 0) {
        console.log(`  [清理分析] 找到 ${cleanupData.immediateFunctions.size} 个可以清理的立即执行函数`);
      }
      
      // 执行清理
      finalCode = cleanupDecryptedFunctions(finalCode, cleanupData, config.cleanupFunctions);
    } else {
      console.log(`  [清理分析] 未找到可以清理的函数`);
    }
  }
  
  return finalCode;
}

/**
 * 主函数
 */
function main() {
  const filePath = argv.file;
  const outputPath = argv.output || filePath;

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error(`✗ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n========== 运行时函数解密工具（新方案） ==========`);
  console.log(`输入文件: ${filePath}`);
  console.log(`输出文件: ${outputPath}`);
  console.log(`拦截模式: ${config.interceptPattern}`);
  console.log(`函数过滤: ${config.functionNamePattern ? config.functionNamePattern : '所有匹配函数'}`);
  console.log(`参数范围: ${config.minArgs}-${config.maxArgs}`);
  console.log(`创建备份: ${argv.backup}`);
  console.log(`详细模式: ${config.verbose}`);
  console.log(`调试模式: ${config.debug}`);
  console.log(`禁用替换: ${config.disableReplace}`);
  console.log(`函数清理: ${config.cleanupFunctions}`);
  console.log(`==========================================\n`);

  try {
    // 读取源代码
    let sourceCode = fs.readFileSync(filePath, 'utf-8');
    console.log(`[Info] 文件大小: ${sourceCode.length} 字节\n`);

    // 创建备份
    if (argv.backup && filePath === outputPath) {
      const backupPath = `${filePath}.bak`;
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, sourceCode, 'utf-8');
        console.log(`✓ 备份文件已创建: ${backupPath}`);
      }
    }

    // 使用新方案处理
    const finalCode = processWithNewStrategy(sourceCode, outputPath);
    
    if (finalCode === null) {
      console.log(`\n[Info] 未找到可处理的函数调用，代码无需修改`);
      return;
    }

    // 检查是否有实际改动
    if (finalCode === sourceCode) {
      console.log(`\n[Info] 代码无需修改`);
    } else {
      // 写入输出文件
      fs.writeFileSync(outputPath, finalCode, 'utf-8');
      console.log(`\n✓ 文件已处理，输出到: ${outputPath}`);
      console.log(`✓ 输出文件大小: ${finalCode.length} 字节`);
      console.log(`✓ 减少了 ${sourceCode.length - finalCode.length} 字节`);
    }

  } catch (error) {
    console.error(`\n✗ 处理失败: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
