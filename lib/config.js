/**
 * 配置管理模块
 * 负责管理命令行参数和配置对象
 */

function createConfig(argv) {
  return {
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
}

/**
 * 检查函数是否应该被处理
 */
function shouldInterceptFunction(config, funcName, argsCount) {
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

module.exports = {
  createConfig,
  shouldInterceptFunction
};