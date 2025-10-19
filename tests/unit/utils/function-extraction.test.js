/**
 * 函数提取工具功能单元测试
 * 测试函数定义提取、立即执行函数提取、常量参数提取等功能
 */

const { extractFunctionDefinitions } = require('../../../lib/core-processor');
const { extractImmediateFunctions } = require('../../../lib/function-testing');
const { extractConstantArguments } = require('../../../lib/ast-utils');
const { extractActualFunctionCalls } = require('../../../lib/function-testing');
const { shouldInterceptFunction } = require('../../../lib/config');

const parser = require('@babel/parser');

const mockConfig = { interceptPattern: /f\d*/,functionNamePattern: /f\d*/};
describe('函数提取工具功能单元测试', () => {
  
  describe('函数定义提取', () => {
    test('应该提取函数声明', () => {
      const code = `
        function f1(a, b) { return a + b; }
        function f2(c, d) { return c * d; }
      `;
      

      const result = extractFunctionDefinitions(code, mockConfig);
      expect(result.functions).toContain('f1');
      expect(result.functions).toContain('f2');
      expect(result.functionCodeMap.has('f1')).toBe(true);
      expect(result.functionCodeMap.has('f2')).toBe(true);
    });

    test('应该提取函数表达式', () => {
      const code = `
        const f1 = function(a, b) { return a + b; };
        const f2 = function(c, d) { return c * d; };
      `;
      
      const result = extractFunctionDefinitions(code,mockConfig);
      expect(result.functions).toContain('f1');
      expect(result.functions).toContain('f2');
    });

    test('应该忽略不匹配模式函数', () => {
      const code = `
        function normalFunction(a, b) { return a + b; }
        function f123(a, b) { return a + b; }
      `;
      
      const result = extractFunctionDefinitions(code,mockConfig);
      expect(result.functions).toContain('f123');
      expect(result.functions).not.toContain('normalFunction');
    });
  });

  describe('立即执行函数提取', () => {
    test('应该提取标准IIFE', () => {
      const code = `
        (function() {
          console.log("立即执行函数");
        })();
      `;
      
      const result = extractImmediateFunctions(code, mockConfig);
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0]).toContain('立即执行函数');
    });

    test('应该提取带感叹号的IIFE', () => {
      const code = `
        !function() {
          console.log("带感叹号的IIFE");
        }();
      `;
      
      const result = extractImmediateFunctions(code, mockConfig);
      expect(result.functions).toHaveLength(1);
    });

    test('应该提取带加号的IIFE', () => {
      const code = `
        +function() {
          console.log("带加号的IIFE");
        }();
      `;
      
      const result = extractImmediateFunctions(code, mockConfig);
      expect(result.functions).toHaveLength(1);
    });

    test('应该检测立即执行函数中的依赖', () => {
      const code = `
        (function() {
          f1(1, 2);
          f2(3, 4);
        })();
      `;
      
      const result = extractImmediateFunctions(code, mockConfig);
      expect(result.dependencies.has('f1')).toBe(true);
      expect(result.dependencies.has('f2')).toBe(true);
    });
  });

  describe('常量参数提取', () => {
    test('应该提取字符串常量', () => {
      const code = `f1("hello", "world")`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      const args = extractConstantArguments(callExpression.arguments);
      expect(args).toEqual(["hello", "world"]);
    });

    test('应该提取数字常量', () => {
      const code = `f1(123, 456)`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      const args = extractConstantArguments(callExpression.arguments);
      expect(args).toEqual([123, 456]);
    });

    test('应该提取布尔常量', () => {
      const code = `f1(true, false)`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      const args = extractConstantArguments(callExpression.arguments);
      expect(args).toEqual([true, false]);
    });

    test('应该提取null和undefined', () => {
      const code = `f1(null, undefined)`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      const args = extractConstantArguments(callExpression.arguments);
      expect(args).toEqual([null, undefined]);
    });

    test('应该处理负号表达式', () => {
      const code = `f1(-123)`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      const args = extractConstantArguments(callExpression.arguments);
      expect(args).toEqual([-123]);
    });

    test('应该标记非常量参数为undefined', () => {
      const code = `f1(a, b)`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      const args = extractConstantArguments(callExpression.arguments);
      expect(args).toEqual([undefined, undefined]);
    });
  });

  describe('实际函数调用提取', () => {
    test('应该提取常量参数函数调用', () => {
      const code = `
        f1(1, 2, "hello");
        f2(true, false);
      `;
      
      const calls = extractActualFunctionCalls(code, mockConfig);
      expect(calls).toHaveLength(2);
      
      const f1Call = calls.find(call => call.funcName === 'f1');
      const f2Call = calls.find(call => call.funcName === 'f2');
      
      expect(f1Call).toBeDefined();
      expect(f2Call).toBeDefined();
      expect(f1Call.args).toEqual([1, 2, "hello"]);
      expect(f2Call.args).toEqual([true, false]);
    });

    test('应该跳过初始化函数调用', () => {
      const code = `
        (function() {
          f1(1, 2);  // 立即执行函数中的调用
        })();
        
        f2(3, 4);    // 正常调用
      `;
      
      const calls = extractActualFunctionCalls(code, mockConfig);
      
      // 只应该提取f2的调用
      const f1Call = calls.find(call => call.funcName === 'f1');
      const f2Call = calls.find(call => call.funcName === 'f2');
      
      expect(f1Call).toBeUndefined();
      expect(f2Call).toBeDefined();
    });

    test('应该处理对象属性中的调用', () => {
      const code = `
        const obj = {
          prop: f1(1, 2)
        };
      `;
      
      const calls = extractActualFunctionCalls(code, mockConfig);
      // 在对象属性中，应该只找到1个调用
      expect(calls).toHaveLength(1);
      expect(calls[0].funcName).toBe('f1');
    });

    test('应该处理数组中的调用', () => {
      const code = `
        const arr = [f1(1, 2), f2(3, 4)];
      `;
      
      const calls = extractActualFunctionCalls(code, mockConfig);
      // 在数组中，应该只找到2个调用（每个元素一个）
      expect(calls).toHaveLength(2);
      expect(calls[0].funcName).toBe('f1');
      expect(calls[1].funcName).toBe('f2');
    });

    test('应该处理赋值表达式中的调用', () => {
      const code = `
        const result = f1(1, 2);
      `;
      
      const calls = extractActualFunctionCalls(code, mockConfig);
      // 在赋值表达式中，应该只找到1个调用
      expect(calls).toHaveLength(1);
      expect(calls[0].funcName).toBe('f1');
    });

    test('应该处理变量声明中的调用', () => {
      const code = `
        const result = f1(1, 2);
      `;
      
      const calls = extractActualFunctionCalls(code, mockConfig);
      // 在变量声明中，应该只找到1个调用
      expect(calls).toHaveLength(1);
      expect(calls[0].funcName).toBe('f1');
    });
  });

  describe('函数拦截检测', () => {
    test('应该拦截匹配模式的函数', () => {
      const config = {
        interceptPattern: /f\d+/,
        functionNamePattern: null,
        minArgs: 2,
        maxArgs: 4
      };
      
      // 模拟全局config
      global.config = config;
      
      expect(shouldInterceptFunction(config,'f123', 3)).toBe(true);
      expect(shouldInterceptFunction(config,'normalFunction', 3)).toBe(false);
    });

    test('应该检查参数数量范围', () => {
      const config = {
        interceptPattern: /f\d+/,
        functionNamePattern: null,
        minArgs: 2,
        maxArgs: 4
      };
      
      global.config = config;
      
      expect(shouldInterceptFunction(config,'f123', 3)).toBe(true);
      expect(shouldInterceptFunction(config,'f123', 1)).toBe(true); // 放宽限制
      expect(shouldInterceptFunction(config,'f123', 5)).toBe(true); // 放宽限制
    });

    test('应该优先检查函数名模式', () => {
      const config = {
        interceptPattern: /f\d+/,
        functionNamePattern: /^f123$/,
        minArgs: 2,
        maxArgs: 4
      };
      
      global.config = config;
      
      expect(shouldInterceptFunction(config,'f123', 3)).toBe(true);
      expect(shouldInterceptFunction(config,'f456', 3)).toBe(false); // 不匹配函数名模式
    });
  });
});

// 清理全局变量
afterEach(() => {
  delete global.config;
});