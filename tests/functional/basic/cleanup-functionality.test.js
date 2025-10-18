/**
 * 基本清理功能测试
 * 测试函数清理、立即执行函数清理、业务逻辑保护等基本功能
 */

const { processWithNewStrategy } = require('../../../de.js');
const fs = require('fs');
const path = require('path');

describe('基本清理功能测试', () => {
  
  describe('函数清理功能', () => {
    test('应该清理未使用的函数', () => {
      const code = `
        function usedFunction() { return "used"; }
        function unusedFunction() { return "unused"; }
        
        const fs = require('fs');
        
        // 业务逻辑
        function businessLogic() {
          return usedFunction();
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // usedFunction应该被保留
      expect(result).toContain('usedFunction');
      // unusedFunction应该被注释或删除
      expect(result).toMatch(/\/\*.*unusedFunction.*\*\/|unusedFunction被移除/);
    });

    test('应该支持注释和删除两种清理模式', () => {
      const code = `
        function toBeCleaned() { return "clean me"; }
        
        const fs = require('fs');
        
        function main() { return "main logic"; }
        
        module.exports = { main };
      `;
      
      // 测试注释模式
      const commentedResult = processCodeWithCleanup(code, 'comment');
      expect(commentedResult).toContain('/*');
      expect(commentedResult).toContain('toBeCleaned');
      
      // 测试删除模式
      const removedResult = processCodeWithCleanup(code, 'remove');
      expect(removedResult).not.toContain('toBeCleaned');
      expect(removedResult).not.toContain('/* [解密清理]');
    });
  });

  describe('立即执行函数清理', () => {
    test('应该清理require之前的立即执行函数', () => {
      const code = `
        // 在require之前的立即执行函数
        (function() {
          console.log("初始化代码 - 应该被清理");
        })();
        
        const fs = require('fs');
        
        // 在require之后的立即执行函数
        (function() {
          console.log("业务逻辑代码 - 应该被保留");
        })();
        
        module.exports = {};
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 验证初始化代码被清理
      expect(result).not.toContain('初始化代码 - 应该被清理');
      // 验证业务逻辑代码被保留
      expect(result).toContain('业务逻辑代码 - 应该被保留');
    });

    test('应该处理各种IIFE语法', () => {
      const code = `
        // 标准IIFE
        (function() { console.log("标准IIFE"); })();
        
        // 感叹号IIFE
        !function() { console.log("感叹号IIFE"); }();
        
        // 加号IIFE
        +function() { console.log("加号IIFE"); }();
        
        const fs = require('fs');
        
        module.exports = {};
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 所有require之前的IIFE都应该被清理
      expect(result).not.toContain('标准IIFE');
      expect(result).not.toContain('感叹号IIFE');
      expect(result).not.toContain('加号IIFE');
    });
  });

  describe('业务逻辑保护', () => {
    test('应该保护被业务逻辑调用的函数', () => {
      const code = `
        function utility1() { return "utility1"; }
        function utility2() { return "utility2"; }
        function unusedUtility() { return "unused"; }
        
        const fs = require('fs');
        
        function businessLogic() {
          const result1 = utility1();
          const result2 = utility2();
          return result1 + result2;
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 被业务逻辑使用的函数应该被保留
      expect(result).toContain('utility1');
      expect(result).toContain('utility2');
      // 未使用的函数应该被清理
      expect(result).not.toContain('unusedUtility');
    });

    test('应该保护依赖链中的所有函数', () => {
      const code = `
        function base() { return "base"; }
        function middle() { return base(); }
        function top() { return middle(); }
        function isolated() { return "isolated"; }
        
        const fs = require('fs');
        
        function businessLogic() {
          return top(); // 调用top，形成依赖链 top -> middle -> base
        }
        
        module.exports = { businessLogic };
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 整个依赖链都应该被保护
      expect(result).toContain('base');
      expect(result).toContain('middle');
      expect(result).toContain('top');
      // 孤立的函数应该被清理
      expect(result).not.toContain('isolated');
    });
  });

  describe('导出函数保护', () => {
    test('应该保护ES6导出的函数', () => {
      const code = `
        function exportedFunc() { return "exported"; }
        function internalFunc() { return "internal"; }
        
        const fs = require('fs');
        
        export { exportedFunc };
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 导出的函数应该被保护
      expect(result).toContain('exportedFunc');
      // 未导出的内部函数可能被清理
      expect(result).not.toContain('internalFunc');
    });

    test('应该保护CommonJS导出的函数', () => {
      const code = `
        function exportedFunc() { return "exported"; }
        function internalFunc() { return "internal"; }
        
        const fs = require('fs');
        
        module.exports = { exportedFunc };
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 导出的函数应该被保护
      expect(result).toContain('exportedFunc');
      // 未导出的内部函数可能被清理
      expect(result).not.toContain('internalFunc');
    });
  });

  describe('边界情况处理', () => {
    test('应该处理没有require的情况', () => {
      const code = `
        function func1() { return "func1"; }
        function func2() { return "func2"; }
        
        // 没有require语句
        function main() {
          return func1() + func2();
        }
        
        module.exports = { main };
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 没有require时，应该保守处理
      expect(result).toContain('func1');
      expect(result).toContain('func2');
      expect(result).toContain('main');
    });

    test('应该处理空文件', () => {
      const code = ``;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 空文件应该保持不变
      expect(result).toBe('');
    });

    test('应该处理只有注释的文件', () => {
      const code = `
        // 这是一个注释
        /* 这是另一个注释 */
      `;
      
      const result = processCodeWithCleanup(code, 'comment');
      
      // 只有注释的文件应该保持不变
      expect(result).toContain('这是一个注释');
      expect(result).toContain('这是另一个注释');
    });
  });

  // 辅助函数：处理代码并返回结果
  function processCodeWithCleanup(code, cleanupMode) {
    const testDir = path.join(__dirname, '../../fixtures/temp');
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
      'cleanup-functions': cleanupMode
    };
    
    global.config = {
      interceptPattern: /f\\d+/,
      cleanupFunctions: cleanupMode,
      verbose: false
    };
    
    // 处理代码
    const result = processWithNewStrategy(code, outputFile);
    
    // 读取处理结果
    let processedCode = code; // 默认返回原代码
    if (result && fs.existsSync(outputFile)) {
      processedCode = fs.readFileSync(outputFile, 'utf8');
    }
    
    // 清理测试文件
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    
    // 清理全局变量
    delete global.argv;
    delete global.config;
    
    return processedCode;
  }
});