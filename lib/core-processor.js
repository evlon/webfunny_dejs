/**
 * 核心处理逻辑模块
 * 协调各模块工作，实现完整的函数解密流程
 */

const fs = require('fs');
const vm = require('vm');
const { parseCode, traverse } = require('./ast-utils');
const { createConfig, shouldInterceptFunction } = require('./config');
const { collectInitializationFunctionCalls, buildFunctionDependencyGraph, topologicalSort } = require('./function-extraction');
const { preprocessCode, extractImmediateFunctions, extractActualFunctionCalls, instrumentFunctionWithTracing } = require('./function-testing');
const { applyCallExpressionReplacements, analyzeFunctionsForCleanup, cleanupDecryptedFunctions } = require('./code-transformation');

/**
 * 提取匹配的函数定义（包含依赖关系）
 */
function extractFunctionDefinitions(code, config) {
  const { extractFunctionName, generate } = require('./ast-utils');
  
  try {
    const ast = parseCode(code);

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
    const initializationCalls = collectInitializationFunctionCalls(code, config);
    
    // 收集立即执行函数中的依赖
    const immediateFunctionsData = extractImmediateFunctions(code, config);
    const immediateDependencies = immediateFunctionsData.dependencies;
    
    // 收集参数依赖（f2(f1) 这种模式）
    const { collectParameterDependencies } = require('./function-extraction');
    const parameterDependencies = collectParameterDependencies(code, config);
    
    // 合并所有依赖
    const allDependencies = new Set([...initializationCalls, ...immediateDependencies, ...parameterDependencies]);

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

    // 构建完整的依赖图并拓扑排序
    const dependencyGraph = buildFunctionDependencyGraph(code, config);
    let sortedFunctions;
    
    try {
      sortedFunctions = topologicalSort(dependencyGraph);
      if (config.verbose && sortedFunctions.length > 0) {
        console.log(`  [拓扑排序] 依赖顺序: ${sortedFunctions.join(' -> ')}`);
      }
    } catch (error) {
      if (config.verbose) {
        console.log(`  [警告] 拓扑排序失败: ${error.message}，使用发现顺序`);
      }
      // 排序失败时使用原来的函数顺序
      sortedFunctions = allFunctions.map(f => f.name);
    }
    
    // 按依赖顺序提取函数
    const extractedFunctions = [];
    
    sortedFunctions.forEach(funcName => {
      const funcInfo = allFunctions.find(f => f.name === funcName);
      if (funcInfo) {
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
      }
    });
    
    // 处理不在依赖图中的函数（通常是孤立函数）
    allFunctions.forEach(funcInfo => {
      if (!sortedFunctions.includes(funcInfo.name)) {
        let functionCode;
        if (funcInfo.type === 'declaration') {
          functionCode = generate(funcInfo.node).code;
        } else {
          functionCode = generate(funcInfo.node).code;
        }
        
        extractedFunctions.push(funcInfo.name);
        functionCodeMap.set(funcInfo.name, functionCode);
        
        if (config.verbose) {
          console.log(`  [补充提取] 孤立函数: ${funcInfo.name}`);
        }
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
 * 生成函数测试代码，基于实际的函数调用
 */
function generateFunctionTestCode(functionCodeMap, actualCalls, originalCode, config) {
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
  const immediateFunctionsData = extractImmediateFunctions(originalCode, config);
  if (immediateFunctionsData.functions.length > 0) {
    testCode += '\n// 执行立即函数（初始化环境）\n';
    
    // 创建一个集合来跟踪已经添加的立即执行函数
    const addedImmediateFunctions = new Set();
    
    immediateFunctionsData.functions.forEach((immediateFunc, index) => {
      // 检查是否已经添加过这个立即执行函数
      const funcKey = Buffer.from(immediateFunc).toString('base64').substring(0, 10);
      if (!addedImmediateFunctions.has(funcKey)) {
        testCode += `
// 立即执行函数 ${index + 1}
${immediateFunc}
`;
        addedImmediateFunctions.add(funcKey);
      }
    });
    
    testCode += '\n';
  }

  // 添加所有函数定义（可能包含跟踪代码）
  functionCodeMap.forEach((code, funcName) => {
    // 如果启用调试模式，为函数添加跟踪代码
    let finalCode = code;
    if (config.debug && config.traceLines) {
      finalCode = instrumentFunctionWithTracing(code, funcName, config);
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
 * 分析函数调用差异
 */
function analyzeFunctionCallDifferences(callLog, actualCalls, config) {
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
 */
function saveDebugLogs(callLog, outputPath, config) {
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
 * 使用新方案处理（基于函数提取和实际调用替换）
 */
function processWithNewStrategy(sourceCode, outputPath, config) {
  console.log(`\n[新方案] 使用函数提取和实际调用替换方案...`);
  
  // 预处理代码：只处理字符串反序
  console.log(`[Step 1] 预处理代码，处理字符串反序...`);
  let processedCode = preprocessCode(sourceCode, config);

  // 提取函数定义
  console.log(`[Step 2] 提取匹配的函数定义...`);
  const { functions: extractedFunctions, functionCodeMap } = extractFunctionDefinitions(processedCode, config);
  
  if (extractedFunctions.length === 0) {
    console.log(`  [Info] 未找到匹配的函数定义，使用原有方案`);
    return null;
  }
  
  console.log(`  [提取完成] 找到 ${extractedFunctions.length} 个函数: ${extractedFunctions.join(', ')}`);
  
  // 提取实际的函数调用
  console.log(`[Step 3] 提取实际的函数调用...`);
  const actualCalls = extractActualFunctionCalls(processedCode, config, shouldInterceptFunction);
  
  if (actualCalls.length === 0) {
    console.log(`  [Info] 未找到实际的常量函数调用`);
    return null;
  }
  
  console.log(`  [提取完成] 找到 ${actualCalls.length} 个常量函数调用`);
  
  // 生成函数测试代码（基于实际调用）
  console.log(`[Step 4] 生成函数测试代码...`);
  const testCode = generateFunctionTestCode(functionCodeMap, actualCalls, sourceCode, config);
  
  // 保存测试代码用于调试
  if (config.verbose) {
    fs.writeFileSync(outputPath+".test.tmp.js", testCode, 'utf-8');
    console.log("测试代码保存:", outputPath+".test.tmp.js");
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
    return null;
  }
  
  console.log(`  [测试完成] 收集到 ${callExpressionMap.size} 个调用结果`);
  
  // 输出调试结果
  if (config.debug) {
    console.log(`\n  [调试信息] 函数调用记录: ${globalCallLog.length} 条`);
    
    // 分析函数调用差异
    analyzeFunctionCallDifferences(globalCallLog, actualCalls, config);
    
    // 保存调试日志到文件
    if (config.outputDebug) {
      saveDebugLogs(globalCallLog, config.outputDebug, config);
    }
  }
  
  // 应用基于调用表达式的替换
  console.log(`[Step 6] 应用调用表达式替换...`);
  let finalCode = applyCallExpressionReplacements(processedCode, callExpressionMap, config);
  
  // 实验性：清理已解密的函数
  if (config.cleanupFunctions !== 'none') {
    console.log(`[Step 7] 分析并清理已解密的函数...`);
    
    // 分析哪些函数可以被清理
    const cleanupData = analyzeFunctionsForCleanup(finalCode, callExpressionMap, actualCalls, config);
    
    const totalCleanup = cleanupData.functions.size + cleanupData.immediateFunctions.size;
    if (totalCleanup > 0) {
      // 执行清理
      finalCode = cleanupDecryptedFunctions(finalCode, cleanupData, config.cleanupFunctions, config);
    } else {
      console.log(`  [清理分析] 未找到可以清理的函数`);
    }
  }
  
  return finalCode;
}

module.exports = {
  extractFunctionDefinitions,
  processWithNewStrategy
};