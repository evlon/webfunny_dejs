/**
 * 导出检测功能单元测试
 * 测试CommonJS和ES6模块导出检测功能
 */

const {
  analyzeFunctionsForCleanup
} = require('../../../de.js');

describe('导出检测功能单元测试', () => {
  
  describe('ES6导出检测', () => {
    test('应该检测命名导出函数', () => {
      const code = `
        function f1() {}
        function f2() {}
        export { f1, f2 };
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 由于ES6导出的检测逻辑在analyzeFunctionsForCleanup内部
      // 这里主要是验证函数能被正确识别
      expect(result.functions.size).toBe(0); // 导出的函数不应该被清理
    });

    test('应该检测默认导出函数', () => {
      const code = `
        function f1() {}
        export default f1;
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      expect(result.functions.size).toBe(0);
    });
  });

  describe('CommonJS导出检测', () => {
    test('应该检测module.exports赋值', () => {
      const code = `
        function f1() {}
        function f2() {}
        module.exports = { f1, f2 };
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      expect(result.functions.size).toBe(0);
    });

    test('应该检测module.exports属性赋值', () => {
      const code = `
        function f1() {}
        function f2() {}
        module.exports.f1 = f1;
        module.exports.f2 = f2;
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      expect(result.functions.size).toBe(0);
    });

    test('应该检测exports属性赋值', () => {
      const code = `
        function f1() {}
        function f2() {}
        exports.f1 = f1;
        exports.f2 = f2;
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      expect(result.functions.size).toBe(0);
    });

    test('应该检测复杂的导出结构', () => {
      const code = `
        function f1() {}
        function f2() {}
        function helper() {}
        
        module.exports = {
          func1: f1,
          func2: f2,
          utils: {
            helper: helper
          }
        };
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      expect(result.functions.size).toBe(0);
    });
  });

  describe('导出检测边界情况', () => {
    test('应该处理部分导出的情况', () => {
      const code = `
        function f1() {}  // 导出
        function f2() {}  // 未导出
        function f3() {}  // 导出
        
        module.exports = { f1, f3 };
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 只有未导出的f2可能被清理
      expect(result.functions.size).toBe(1);
      expect(result.functions.has('f2')).toBe(true);
    });

    test('应该处理动态导出', () => {
      const code = `
        function f1() {}
        function f2() {}
        
        if (process.env.NODE_ENV === 'production') {
          module.exports = { f1 };
        } else {
          module.exports = { f2 };
        }
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 由于动态导出，应该保守地不清理任何函数
      expect(result.functions.size).toBe(0);
    });

    test('应该处理条件导出', () => {
      const code = `
        function f1() {}
        function f2() {}
        
        const config = {
          func1: condition ? f1 : f2
        };
        
        module.exports = config;
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 条件导出应该保守处理
      expect(result.functions.size).toBe(0);
    });
  });

  describe('清理边界检测', () => {
    test('应该识别require语句作为清理边界', () => {
      const code = `
        // 在require之前的立即执行函数
        (function() {
          console.log("初始化");
        })();
        
        const fs = require('fs');
        
        // 在require之后的立即执行函数
        (function() {
          console.log("业务逻辑");
        })();
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 应该只清理require之前的立即执行函数
      expect(result.immediateFunctions.size).toBe(1);
    });

    test('应该处理没有require的情况', () => {
      const code = `
        (function() {
          console.log("没有require的代码");
        })();
        
        function businessLogic() {
          console.log("业务逻辑");
        }
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 没有require时，不清理任何立即执行函数
      expect(result.immediateFunctions.size).toBe(0);
    });

    test('应该处理多个require的情况', () => {
      const code = `
        // 在第一个require之前
        (function() {
          console.log("初始化1");
        })();
        
        const fs = require('fs');
        
        // 在第一个require之后，第二个require之前
        (function() {
          console.log("初始化2");
        })();
        
        const path = require('path');
        
        // 在第二个require之后
        (function() {
          console.log("业务逻辑");
        })();
      `;
      
      const result = analyzeFunctionsForCleanup(code, new Map(), []);
      
      // 应该只清理第一个require之前的立即执行函数
      expect(result.immediateFunctions.size).toBe(1);
    });
  });

  describe('业务逻辑保护', () => {
    test('应该保护被业务逻辑调用的函数', () => {
      const code = `
        function f1() {}
        function f2() { f1(); }
        function f3() {}
        
        const fs = require('fs');
        
        // 业务逻辑
        function businessLogic() {
          f2();  // 调用f2，间接调用f1
        }
        
        // 未使用的函数
        function unused() {}
      `;
      
      const actualCalls = [
        { funcName: 'f2', args: [] }
      ];
      
      const result = analyzeFunctionsForCleanup(code, new Map(), actualCalls);
      
      // f1和f2被业务逻辑保护，f3可能被清理
      expect(result.functions.has('f3')).toBe(true);
      expect(result.functions.has('f1')).toBe(false);
      expect(result.functions.has('f2')).toBe(false);
    });

    test('应该保护整个依赖链', () => {
      const code = `
        function f1() {}
        function f2() { f1(); }
        function f3() { f2(); }
        function f4() {}
        
        const fs = require('fs');
        
        function businessLogic() {
          f3();  // 调用f3，形成依赖链 f3 -> f2 -> f1
        }
      `;
      
      const actualCalls = [
        { funcName: 'f3', args: [] }
      ];
      
      const result = analyzeFunctionsForCleanup(code, new Map(), actualCalls);
      
      // 整个依赖链都应该被保护
      expect(result.functions.has('f1')).toBe(false);
      expect(result.functions.has('f2')).toBe(false);
      expect(result.functions.has('f3')).toBe(false);
      expect(result.functions.has('f4')).toBe(true); // f4未使用，可能被清理
    });
  });
});