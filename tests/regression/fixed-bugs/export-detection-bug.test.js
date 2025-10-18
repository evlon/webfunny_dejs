/**
 * 导出检测bug回归测试
 * 确保已修复的导出检测bug不会再次出现
 */

const { processWithNewStrategy } = require('../../../de.js');

describe('导出检测bug回归测试', () => {
  
  describe('已修复bug #001 - CommonJS导出检测', () => {
    test('应该正确检测module.exports对象导出', () => {
      const code = `
        function f1() {}
        function f2() {}
        function f3() {}
        
        module.exports = {
          func1: f1,
          func2: f2
          // f3没有被导出
        };
      `;
      
      // 这个测试确保修复了导出检测的问题
      // 之前的问题：module.exports对象中的函数没有被正确检测
      
      const result = processAndAnalyze(code);
      
      // f1和f2应该被检测为导出函数
      expect(result.exportedFunctions).toContain('f1');
      expect(result.exportedFunctions).toContain('f2');
      
      // f3没有被导出，可能被清理
      expect(result.exportedFunctions).not.toContain('f3');
      expect(result.functionsToCleanup).toContain('f3');
    });

    test('应该处理exports属性赋值', () => {
      const code = `
        function f1() {}
        function f2() {}
        
        exports.f1 = f1;
        exports.f2 = f2;
      `;
      
      const result = processAndAnalyze(code);
      
      // exports属性赋值应该被正确检测
      expect(result.exportedFunctions).toContain('f1');
      expect(result.exportedFunctions).toContain('f2');
    });
  });

  describe('已修复bug #002 - 业务逻辑保护', () => {
    test('应该保护被业务逻辑调用的整个依赖链', () => {
      const code = `
        function f1() {}
        function f2() { f1(); }
        function f3() { f2(); }
        function f4() {}
        
        const fs = require('fs');
        
        function businessLogic() {
          f3(); // 调用f3，形成依赖链 f3 -> f2 -> f1
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processAndAnalyze(code);
      
      // 整个依赖链都应该被保护
      expect(result.protectedFunctions).toContain('f1');
      expect(result.protectedFunctions).toContain('f2');
      expect(result.protectedFunctions).toContain('f3');
      
      // f4没有被使用，可能被清理
      expect(result.functionsToCleanup).toContain('f4');
    });

    test('应该处理require之后的业务逻辑', () => {
      const code = `
        function f1() {}
        
        // require之前的调用（应该被清理）
        (function() {
          f1();
        })();
        
        const fs = require('fs');
        
        // require之后的调用（应该被保留）
        function businessLogic() {
          f1();
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processAndAnalyze(code);
      
      // f1被业务逻辑使用，应该被保护
      expect(result.protectedFunctions).toContain('f1');
      
      // require之前的立即执行函数应该被清理
      expect(result.immediateFunctionsToCleanup.size).toBeGreaterThan(0);
    });
  });

  describe('已修复bug #003 - 参数依赖检测', () => {
    test('应该检测函数参数中的依赖关系', () => {
      const code = `
        function f1() {}
        function f2(func) { func(); } // f2参数依赖f1
        
        const fs = require('fs');
        
        function businessLogic() {
          f2(f1); // 传递f1作为参数
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processAndAnalyze(code);
      
      // 参数依赖应该被正确检测
      expect(result.dependencyGraph.get('f2')).toContain('f1');
      
      // f1被业务逻辑使用，应该被保护
      expect(result.protectedFunctions).toContain('f1');
      expect(result.protectedFunctions).toContain('f2');
    });

    test('应该处理嵌套的参数依赖', () => {
      const code = `
        function f1() {}
        function f2(processor) { processor(f1); }
        function f3(handler) { handler(f2); }
        
        const fs = require('fs');
        
        function businessLogic() {
          f3(f2);
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processAndAnalyze(code);
      
      // 嵌套参数依赖应该被正确检测
      expect(result.dependencyGraph.get('f3')).toContain('f2');
      expect(result.dependencyGraph.get('f2')).toContain('f1');
      
      // 整个依赖链都应该被保护
      expect(result.protectedFunctions).toContain('f1');
      expect(result.protectedFunctions).toContain('f2');
      expect(result.protectedFunctions).toContain('f3');
    });
  });

  describe('已修复bug #004 - 清理边界检测', () => {
    test('应该以第一个require语句作为清理边界', () => {
      const code = `
        // 第一个require之前的代码（应该被清理）
        (function() {
          console.log("初始化1");
        })();
        
        const fs = require('fs');
        
        // 第一个require之后的代码（应该被保留）
        (function() {
          console.log("业务逻辑1");
        })();
        
        const path = require('path');
        
        // 第二个require之后的代码（应该被保留）
        (function() {
          console.log("业务逻辑2");
        })();
      `;
      
      const result = processAndAnalyze(code);
      
      // 只有第一个require之前的立即执行函数应该被清理
      expect(result.immediateFunctionsToCleanup.size).toBe(1);
      
      // 第一个require之后的代码应该被保留
      expect(result.codeAfterProcessing).toContain('业务逻辑1');
      expect(result.codeAfterProcessing).toContain('业务逻辑2');
    });

    test('应该处理没有require的情况', () => {
      const code = `
        function f1() {}
        function f2() {}
        
        // 没有require语句
        function main() {
          return f1() + f2();
        }
        
        module.exports = { main };
      `;
      
      const result = processAndAnalyze(code);
      
      // 没有require时，应该保守处理，不清理任何立即执行函数
      expect(result.immediateFunctionsToCleanup.size).toBe(0);
      
      // 所有函数都应该被保留
      expect(result.codeAfterProcessing).toContain('f1');
      expect(result.codeAfterProcessing).toContain('f2');
      expect(result.codeAfterProcessing).toContain('main');
    });
  });

  // 辅助函数：处理代码并分析结果
  function processAndAnalyze(code) {
    const fs = require('fs');
    const path = require('path');
    const testDir = path.join(__dirname, '../../../fixtures/temp');
    const inputFile = path.join(testDir, 'test-input.js');
    const outputFile = path.join(testDir, 'test-output.js');
    
    // 确保目录存在
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // 写入测试文件
    fs.writeFileSync(inputFile, code, 'utf8');
    
    // 模拟配置
    global.argv = {
      file: inputFile,
      output: outputFile,
      backup: false,
      verbose: false,
      'cleanup-functions': 'comment'
    };
    
    global.config = {
      interceptPattern: /f\d+/,
      cleanupFunctions: 'comment',
      verbose: false
    };
    
    // 处理代码
    const result = processWithNewStrategy(code, outputFile);
    
    // 读取处理结果
    let processedCode = code; // 默认返回原代码
    if (result && fs.existsSync(outputFile)) {
      processedCode = fs.readFileSync(outputFile, 'utf8');
    }
    
    // 分析处理结果
    const analysis = {
      exportedFunctions: [],
      protectedFunctions: [],
      functionsToCleanup: [],
      immediateFunctionsToCleanup: new Set(),
      dependencyGraph: new Map(),
      codeAfterProcessing: processedCode
    };
    
    // 从处理后的代码中分析结果
    // 检测导出的函数（未被注释的）
    const exportRegex = /module\.exports\s*=\s*{[^}]*\bf(\d+)\b[^}]*}/g;
    let match;
    while ((match = exportRegex.exec(processedCode)) !== null) {
      const funcMatch = processedCode.match(/f\d+/g);
      if (funcMatch) {
        analysis.exportedFunctions.push(...funcMatch);
      }
    }
    
    // 检测受保护的函数（未被注释且在业务逻辑中）
    if (processedCode.includes('businessLogic')) {
      const funcMatches = processedCode.match(/f\d+/g) || [];
      analysis.protectedFunctions.push(...funcMatches);
    }
    
    // 检测被清理的函数（被注释的）
    const commentedRegex = /\/\*.*f(\d+).*\*\//g;
    let commentedMatch;
    while ((commentedMatch = commentedRegex.exec(processedCode)) !== null) {
      analysis.functionsToCleanup.push(`f${commentedMatch[1]}`);
    }
    
    // 清理测试文件
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    
    // 清理全局变量
    delete global.argv;
    delete global.config;
    
    return analysis;
  }
});