/**
 * 参数依赖集成测试
 * 测试参数依赖检测与实际代码清理的集成流程
 */

const { processWithNewStrategy } = require('../../../de.js');
const fs = require('fs');
const path = require('path');

describe('参数依赖集成测试', () => {
  
  const testFixturesDir = path.join(__dirname, '../../fixtures/input');
  const testOutputDir = path.join(__dirname, '../../fixtures/expected');
  
  // 创建测试目录
  beforeAll(() => {
    if (!fs.existsSync(testFixturesDir)) {
      fs.mkdirSync(testFixturesDir, { recursive: true });
    }
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  describe('参数依赖检测集成', () => {
    test('应该正确处理参数依赖链', () => {
      const code = `
        // 测试参数依赖链
        function f1(a, b) { return a + b; }
        function f2(func) { return func(1, 2); } // f2参数依赖f1
        function f3(processor) { return processor(f1); } // f3参数依赖f1
        
        // 初始化调用
        (function() {
          const result = f2(f1);
          console.log("初始化结果:", result);
        })();
        
        // 业务逻辑
        const fs = require('fs');
        
        function businessLogic() {
          return f3(f2); // 业务逻辑使用
        }
        
        module.exports = { businessLogic };
      `;
      
      const inputFile = path.join(testFixturesDir, 'parameter-dependency-chain.js');
      const outputFile = path.join(testOutputDir, 'parameter-dependency-chain-processed.js');
      
      fs.writeFileSync(inputFile, code, 'utf8');
      
      // 模拟命令行参数
      global.argv = {
        file: inputFile,
        output: outputFile,
        backup: false,
        verbose: true,
        debug: false,
        'cleanup-functions': 'comment',
        'string-reverse': true,
        'function-calls': true,
        'intercept-pattern': 'f\\d+',
        'min-args': 1,
        'max-args': 6
      };
      
      // 模拟配置
      global.config = {
        interceptPattern: /f\d+/,
        functionNamePattern: null,
        minArgs: 1,
        maxArgs: 6,
        verbose: true,
        debug: false,
        cleanupFunctions: 'comment',
        decryptStringReverse: true,
        decryptFunctionCalls: true
      };
      
      const result = processWithNewStrategy(code, outputFile);
      
      // 验证处理结果
      expect(result).not.toBeNull();
      
      if (fs.existsSync(outputFile)) {
        const processedCode = fs.readFileSync(outputFile, 'utf8');
        
        // 验证函数依赖关系被正确处理
        expect(processedCode).toContain('f1'); // f1被业务逻辑使用
        expect(processedCode).toContain('f2'); // f2被业务逻辑使用
        expect(processedCode).toContain('f3'); // f3被业务逻辑使用
        
        // 验证业务逻辑被保留
        expect(processedCode).toContain('businessLogic');
        expect(processedCode).toContain('module.exports');
        
        // 验证初始化代码被清理
        expect(processedCode).not.toContain('初始化结果');
      }
      
      // 清理全局变量
      delete global.argv;
      delete global.config;
    });

    test('应该处理复杂的参数嵌套依赖', () => {
      const code = `
        // 复杂参数依赖测试
        function f1(x) { return x * 2; }
        function f2(transformer) { return transformer(f1); } // f2参数依赖f1
        function f3(mapper) { return mapper(f2); } // f3参数依赖f2
        function f4(processor) { return processor(f3); } // f4参数依赖f3
        
        // 多层参数传递
        function complexLogic() {
          return f4(f3); // f4 -> f3 -> f2 -> f1
        }
        
        // 初始化代码
        (function() {
          const result = complexLogic();
        })();
        
        const fs = require('fs');
        
        // 业务逻辑
        module.exports = { complexLogic };
      `;
      
      const inputFile = path.join(testFixturesDir, 'complex-parameter-dependency.js');
      const outputFile = path.join(testOutputDir, 'complex-parameter-dependency-processed.js');
      
      fs.writeFileSync(inputFile, code, 'utf8');
      
      // 模拟配置
      global.argv = {
        file: inputFile,
        output: outputFile,
        backup: false,
        verbose: true,
        'cleanup-functions': 'comment'
      };
      
      global.config = {
        interceptPattern: /f\d+/,
        verbose: true,
        cleanupFunctions: 'comment'
      };
      
      const result = processWithNewStrategy(code, outputFile);
      
      expect(result).not.toBeNull();
      
      if (fs.existsSync(outputFile)) {
        const processedCode = fs.readFileSync(outputFile, 'utf8');
        
        // 验证复杂的依赖链被正确处理
        expect(processedCode).toContain('f1');
        expect(processedCode).toContain('f2');
        expect(processedCode).toContain('f3');
        expect(processedCode).toContain('f4');
        expect(processedCode).toContain('complexLogic');
        
        // 验证初始化代码被清理
        expect(processedCode).not.toMatch(/初始化代码|result\s*=/);
      }
      
      delete global.argv;
      delete global.config;
    });
  });

  describe('边界情况集成测试', () => {
    test('应该处理混合参数和直接调用依赖', () => {
      const code = `
        // 混合依赖测试
        function f1(a) { return a; }
        function f2(b) { 
          f1(b); // 直接调用依赖
          return b; 
        }
        function f3(func) { 
          func(1); // 参数依赖
          return func; 
        }
        function f4(processor) {
          processor(f2); // 参数依赖f2
          f3(f1);        // 参数依赖f1
          return processor;
        }
        
        const fs = require('fs');
        
        // 业务逻辑
        function mixedDependencyLogic() {
          return f4(f3);
        }
        
        module.exports = { mixedDependencyLogic };
      `;
      
      const inputFile = path.join(testFixturesDir, 'mixed-dependency.js');
      const outputFile = path.join(testOutputDir, 'mixed-dependency-processed.js');
      
      fs.writeFileSync(inputFile, code, 'utf8');
      
      global.argv = { file: inputFile, output: outputFile, 'cleanup-functions': 'comment' };
      global.config = { interceptPattern: /f\d+/, cleanupFunctions: 'comment' };
      
      const result = processWithNewStrategy(code, outputFile);
      
      expect(result).not.toBeNull();
      
      if (fs.existsSync(outputFile)) {
        const processedCode = fs.readFileSync(outputFile, 'utf8');
        
        // 验证所有依赖函数被正确保留
        expect(processedCode).toContain('f1');
        expect(processedCode).toContain('f2');
        expect(processedCode).toContain('f3');
        expect(processedCode).toContain('f4');
        expect(processedCode).toContain('mixedDependencyLogic');
      }
      
      delete global.argv;
      delete global.config;
    });

    test('应该处理循环参数依赖', () => {
      const code = `
        // 循环参数依赖测试
        function f1(processor) {
          if (processor) {
            return processor(f2); // f1参数依赖f2
          }
          return null;
        }
        
        function f2(handler) {
          if (handler) {
            return handler(f1); // f2参数依赖f1
          }
          return null;
        }
        
        // 避免实际循环调用
        function safeCall() {
          return f1(null); // 安全调用
        }
        
        const fs = require('fs');
        
        module.exports = { safeCall };
      `;
      
      const inputFile = path.join(testFixturesDir, 'circular-dependency.js');
      const outputFile = path.join(testOutputDir, 'circular-dependency-processed.js');
      
      fs.writeFileSync(inputFile, code, 'utf8');
      
      global.argv = { file: inputFile, output: outputFile, 'cleanup-functions': 'comment' };
      global.config = { interceptPattern: /f\d+/, cleanupFunctions: 'comment' };
      
      const result = processWithNewStrategy(code, outputFile);
      
      expect(result).not.toBeNull();
      
      if (fs.existsSync(outputFile)) {
        const processedCode = fs.readFileSync(outputFile, 'utf8');
        
        // 循环依赖应该被正确处理
        expect(processedCode).toContain('f1');
        expect(processedCode).toContain('f2');
        expect(processedCode).toContain('safeCall');
      }
      
      delete global.argv;
      delete global.config;
    });
  });

  describe('性能与稳定性集成测试', () => {
    test('应该处理大型参数依赖图', () => {
      // 生成大型依赖图测试代码
      let code = 'const fs = require("fs");\n\n';
      
      // 创建20个相互依赖的函数
      for (let i = 1; i <= 20; i++) {
        if (i === 1) {
          code += `function f${i}(x) { return x; }\n`;
        } else {
          code += `function f${i}(func) { return func(f${i-1}); }\n`;
        }
      }
      
      code += '\nfunction businessLogic() {\n  return f20(f19);\n}\n';
      code += 'module.exports = { businessLogic };\n';
      
      const inputFile = path.join(testFixturesDir, 'large-dependency-graph.js');
      const outputFile = path.join(testOutputDir, 'large-dependency-graph-processed.js');
      
      fs.writeFileSync(inputFile, code, 'utf8');
      
      global.argv = { file: inputFile, output: outputFile, 'cleanup-functions': 'comment' };
      global.config = { interceptPattern: /f\d+/, cleanupFunctions: 'comment' };
      
      const startTime = Date.now();
      const result = processWithNewStrategy(code, outputFile);
      const endTime = Date.now();
      
      // 性能检查：处理大型依赖图应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
      expect(result).not.toBeNull();
      
      if (fs.existsSync(outputFile)) {
        const processedCode = fs.readFileSync(outputFile, 'utf8');
        
        // 验证关键函数被保留
        expect(processedCode).toContain('businessLogic');
        expect(processedCode).toContain('module.exports');
      }
      
      delete global.argv;
      delete global.config;
    });
  });

  // 清理测试文件
  afterAll(() => {
    if (fs.existsSync(testFixturesDir)) {
      fs.rmSync(testFixturesDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });
});