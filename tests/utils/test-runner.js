/**
 * 统一测试运行器
 * 提供统一的测试接口和配置管理
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestRunner {
  constructor(options = {}) {
    this.options = {
      testDir: path.join(__dirname, '..'),
      fixturesDir: path.join(__dirname, '../fixtures'),
      coverage: true,
      verbose: false,
      ...options
    };
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 运行所有测试...\n');
    
    const results = {
      unit: await this.runUnitTests(),
      integration: await this.runIntegrationTests(),
      functional: await this.runFunctionalTests(),
      regression: await this.runRegressionTests()
    };

    return this.generateReport(results);
  }

  /**
   * 运行单元测试
   */
  async runUnitTests() {
    console.log('📊 运行单元测试...');
    return this.runJestTests('unit');
  }

  /**
   * 运行集成测试
   */
  async runIntegrationTests() {
    console.log('🔗 运行集成测试...');
    return this.runJestTests('integration');
  }

  /**
   * 运行功能测试
   */
  async runFunctionalTests() {
    console.log('🎯 运行功能测试...');
    return this.runJestTests('functional');
  }

  /**
   * 运行回归测试
   */
  async runRegressionTests() {
    console.log('🔄 运行回归测试...');
    return this.runJestTests('regression');
  }

  /**
   * 使用Jest运行特定类型的测试
   */
  async runJestTests(testType) {
    return new Promise((resolve, reject) => {
      const args = [
        '--testPathPatterns', `tests/${testType}`,
        '--passWithNoTests'
      ];

      if (this.options.coverage) {
        args.push('--coverage');
      }

      if (this.options.verbose) {
        args.push('--verbose');
      }

      const jestProcess = spawn('npx', ['jest', ...args], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..')
      });

      jestProcess.on('close', (code) => {
        resolve({
          type: testType,
          success: code === 0,
          exitCode: code
        });
      });

      jestProcess.on('error', reject);
    });
  }

  /**
   * 生成测试报告
   */
  generateReport(results) {
    const totalTests = Object.values(results).length;
    const passedTests = Object.values(results).filter(r => r.success).length;
    const successRate = (passedTests / totalTests) * 100;

    console.log('\n📋 测试报告');
    console.log('='.repeat(50));
    
    Object.entries(results).forEach(([type, result]) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      console.log(`${type.padEnd(15)} ${status}`);
    });

    console.log('='.repeat(50));
    console.log(`总计: ${passedTests}/${totalTests} 通过 (${successRate.toFixed(1)}%)`);

    return {
      success: passedTests === totalTests,
      results,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate
      }
    };
  }

  /**
   * 清理测试环境
   */
  cleanup() {
    const tempDir = path.join(this.options.fixturesDir, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * 验证测试环境
   */
  validateEnvironment() {
    const requiredDirs = [
      this.options.testDir,
      this.options.fixturesDir,
      path.join(this.options.fixturesDir, 'input'),
      path.join(this.options.fixturesDir, 'expected')
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        throw new Error(`缺少必要目录: ${dir}`);
      }
    }

    console.log('✅ 测试环境验证通过');
    return true;
  }
}

module.exports = TestRunner;

// 命令行接口
if (require.main === module) {
  const runner = new TestRunner({
    verbose: process.argv.includes('--verbose'),
    coverage: !process.argv.includes('--no-coverage')
  });

  runner.validateEnvironment();
  
  const testType = process.argv[2];
  
  switch (testType) {
    case 'unit':
      runner.runUnitTests();
      break;
    case 'integration':
      runner.runIntegrationTests();
      break;
    case 'functional':
      runner.runFunctionalTests();
      break;
    case 'regression':
      runner.runRegressionTests();
      break;
    default:
      runner.runAllTests().then(report => {
        if (!report.success) {
          process.exit(1);
        }
      });
  }
}