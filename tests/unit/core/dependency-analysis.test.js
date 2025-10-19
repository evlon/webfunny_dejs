/**
 * 依赖分析核心功能单元测试
 * 测试函数依赖检测、参数依赖分析、拓扑排序等核心功能
 */

const {
  collectParameterDependencies,
  collectInitializationFunctionCalls,
  buildFunctionDependencyGraph,
  topologicalSort
} = require('../../../lib/function-extraction');

const {
  extractFunctionName,
  isInitializationFunction
} = require('../../../lib/ast-utils');

const parser = require('@babel/parser');

describe('依赖分析核心功能单元测试', () => {
  
  describe('参数依赖检测', () => {
    test('应该检测到函数参数中的依赖关系', () => {
      const code = `
        function f1(a, b) { return a + b; }
        function f2(func) { return func(1, 2); }
        f2(f1);
      `;
      
      const mockConfig = { interceptPattern: /f\d+/ };
      const dependencies = collectParameterDependencies(code, mockConfig);
      expect(Array.from(dependencies)).toContain('f1');
    });

    test('应该忽略非函数参数', () => {
      const code = `
        function f1(a, b) { return a + b; }
        function f2(x, y) { return x + y; }
        f2(1, 2);
      `;
      
      const mockConfig = { interceptPattern: /f\d+/ };
      const dependencies = collectParameterDependencies(code, mockConfig);
      expect(dependencies.size).toBe(0);
    });

    test('应该处理嵌套的参数依赖', () => {
      const code = `
        function f1(a) { return a; }
        function f2(func) { return func; }
        function f3(f) { return f(f1); }
        f3(f2);
      `;
      
      const mockConfig = { interceptPattern: /f\d*/ };
      const dependencies = collectParameterDependencies(code, mockConfig);
      expect(Array.from(dependencies)).toContain('f2');
      expect(Array.from(dependencies)).toContain('f1');
    });
  });

  describe('初始化函数调用收集', () => {
    test('应该收集立即执行函数中的调用', () => {
      const code = `
        function f1(a, b) { return a + b; }
        (function() {
          f1(1, 2);
        })();
      `;
      
      const mockConfig = { interceptPattern: /f\d+/, verbose: false };
      const calls = collectInitializationFunctionCalls(code, mockConfig);
      expect(calls.size).toBeGreaterThan(0);
    });

    test('应该收集参数依赖中的函数', () => {
      const code = `
        function f1(a, b) { return a + b; }
        function f2(func) { return func(1, 2); }
        f2(f1);
      `;
      
      const mockConfig = { interceptPattern: /f\d+/, verbose: false };
      const calls = collectInitializationFunctionCalls(code, mockConfig);
      expect(calls.has('f1')).toBe(true);
    });

    test('应该收集嵌套依赖关系', () => {
      const code = `
        function f1(a) { return a; }
        function f2(b) { return f1(b); }
        function f3(c) { return f2(c); }
        (function() {
          f3(1);
        })();
      `;
      
      const mockConfig = { interceptPattern: /f\d+/, verbose: false };
      const calls = collectInitializationFunctionCalls(code, mockConfig);
      expect(calls.has('f1')).toBe(true);
      expect(calls.has('f2')).toBe(true);
      expect(calls.has('f3')).toBe(true);
    });
  });

  describe('函数依赖图构建', () => {
    test('应该构建正确的依赖关系图', () => {
      const code = `
        function f1() {}
        function f2() { f1(); }
        function f3() { f2(); f1(); }
      `;
      
      const mockConfig = { interceptPattern: /f\d+/, verbose: false };
      const graph = buildFunctionDependencyGraph(code, mockConfig);
      
      expect(graph.has('f1')).toBe(true);
      expect(graph.has('f2')).toBe(true);
      expect(graph.has('f3')).toBe(true);
      
      expect(graph.get('f2')).toContain('f1');
      expect(graph.get('f3')).toContain('f2');
      expect(graph.get('f3')).toContain('f2');
      expect(graph.get('f3')).toContain('f1');
    });

    test('应该处理参数依赖', () => {
      const code = `
        function f1() {}
        function f2(func) { func(); }
        function f3() { f2(f1); }
      `;
      
      const mockConfig = { interceptPattern: /f\d+/, verbose: false };
      const graph = buildFunctionDependencyGraph(code, mockConfig);
      expect(graph.get('f3')).toContain('f2');
      expect(graph.get('f3')).toContain('f1');
    });

    test('应该处理函数表达式', () => {
      const code = `
        const f1 = function() {};
        const f2 = function() { f1(); };
      `;
      
      const mockConfig = { interceptPattern: /f\d+/, verbose: false };
      const graph = buildFunctionDependencyGraph(code, mockConfig);
      expect(graph.has('f1')).toBe(true);
      expect(graph.has('f2')).toBe(true);
      expect(graph.get('f2')).toContain('f1');
    });
  });

  describe('拓扑排序', () => {
    test('应该正确排序无环依赖图', () => {
      const graph = new Map([
        ['f1', new Set()],
        ['f2', new Set(['f1'])],
        ['f3', new Set(['f2'])]
      ]);
      
      const sorted = topologicalSort(graph);
      
      // 拓扑排序结果应该包含所有节点
      expect(sorted).toHaveLength(3);
      
      // f1 应该在 f2 之前
      expect(sorted.indexOf('f1')).toBeLessThan(sorted.indexOf('f2'));
      
      // f2 应该在 f3 之前
      expect(sorted.indexOf('f2')).toBeLessThan(sorted.indexOf('f3'));
    });

    test('应该检测循环依赖', () => {
      const graph = new Map([
        ['f1', new Set(['f3'])],
        ['f2', new Set(['f1'])],
        ['f3', new Set(['f2'])]
      ]);
      
      expect(() => topologicalSort(graph)).toThrow('发现循环依赖');
    });

    test('应该处理孤立节点', () => {
      const graph = new Map([
        ['f1', new Set()],
        ['f2', new Set(['f1'])],
        ['f3', new Set()]  // 孤立节点
      ]);
      
      const sorted = topologicalSort(graph);
      expect(sorted).toHaveLength(3);
      expect(sorted).toContain('f1');
      expect(sorted).toContain('f2');
      expect(sorted).toContain('f3');
    });
  });

  describe('函数名提取', () => {
    test('应该提取标识符函数名', () => {
      const ast = parser.parse('f1(1, 2)');
      const callExpression = ast.program.body[0].expression;
      
      const funcName = extractFunctionName(callExpression.callee);
      expect(funcName).toBe('f1');
    });

    test('应该提取成员表达式函数名', () => {
      const ast = parser.parse('obj.f1(1, 2)');
      const callExpression = ast.program.body[0].expression;
      
      const funcName = extractFunctionName(callExpression.callee);
      expect(funcName).toBe('f1');
    });

    test('应该忽略保留关键字', () => {
      const ast = parser.parse('(function(){})(1, 2)');
      const callExpression = ast.program.body[0].expression;
      
      const funcName = extractFunctionName(callExpression.callee);
      expect(funcName).toBeNull();
    });
  });

  describe('初始化函数检测', () => {
    test('应该检测立即执行函数', () => {
      const code = `(function() { f1(); })();`;
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].expression;
      
      // 模拟路径对象
      const mockPath = {
        node: callExpression,
        parentPath: {
          node: {
            type: 'CallExpression',
            callee: { type: 'FunctionExpression' }
          }
        }
      };
      
      const isInitialization = isInitializationFunction(mockPath);
      expect(isInitialization).toBe(true);
    });

    test('应该检测do-while循环中的调用', () => {
      const code = `
        do {
          f1();
        } while(false);
      `;
      
      const ast = parser.parse(code);
      const callExpression = ast.program.body[0].body.body[0].expression;
      
      // 模拟路径对象
      const mockPath = {
        node: callExpression,
        findParent: (predicate) => {
          if (predicate.toString().includes('DoWhileStatement')) {
            return { isDoWhileStatement: () => true };
          }
          return null;
        }
      };
      
      const isInitialization = isInitializationFunction(mockPath);
      expect(isInitialization).toBe(true);
    });
  });
});

module.exports = {
  collectParameterDependencies,
  collectInitializationFunctionCalls,
  buildFunctionDependencyGraph,
  topologicalSort
};