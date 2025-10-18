#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// 导入核心模块
const { createConfig } = require('./lib/config');
const { processWithNewStrategy } = require('./lib/core-processor');

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

  // 创建配置对象
  const config = createConfig(argv);

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
    const finalCode = processWithNewStrategy(sourceCode, outputPath, config);
    
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