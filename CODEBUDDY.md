# CODEBUDDY.md This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

`webfunny_dejs` is a JavaScript code analysis and deobfuscation tool that specializes in runtime function decryption. It uses Babel's AST parser to analyze JavaScript code, extract and decrypt obfuscated functions, and simplify code by replacing function calls with their computed constant values.

## Development Commands

### Installation
```bash
npm install
```

### Running the Tool
```bash
# Basic usage
node de.js -f input.js

# Specify output file
node de.js -f input.js -o output.js

# Verbose mode with debugging
node de.js -f input.js -v -d

# Custom function name pattern
node de.js -f input.js --function-name "f\\d+"
```

## Architecture and Core Components

### Main Entry Point: `de.js`
- **Location**: Root directory
- **Purpose**: CLI tool entry point with comprehensive command-line argument parsing
- **Key Dependencies**: 
  - Babel parser, traverse, and generator for AST manipulation
  - Node.js VM for safe function execution
  - yargs for CLI argument parsing

### Processing Pipeline
1. **Preprocessing**: Handles string reverse operations (`"hello".split("").reverse().join("")` → `"olleh"`)
2. **AST Analysis**: Uses Babel parser to build abstract syntax tree
3. **Function Extraction**: Identifies functions matching specific patterns (default: `f\d+`)
4. **Dependency Analysis**: Resolves function call dependencies and topological sorting
5. **Runtime Execution**: Executes extracted functions in isolated VM environment
6. **Code Replacement**: Replaces function calls with computed constant values
7. **Cleanup**: Optionally comments or removes decrypted functions

### Key Architecture Features

#### Function Extraction Strategy
- **Pattern Matching**: Default intercepts functions named like `f123`, `f456`, etc.
- **Dependency Resolution**: Handles nested function calls and topological sorting
- **Immediate Functions**: Processes IIFEs (Immediately Invoked Function Expressions)

#### VM Execution Environment
- **Isolated Context**: Creates safe execution environment using Node.js VM
- **Function Instrumentation**: Optional debug tracing for function execution
- **Timeout Protection**: 30-second execution timeout to prevent infinite loops

#### AST-Based Replacement
- **Precise Targeting**: Uses AST traversal to replace specific call expressions
- **Type-Safe Replacement**: Handles different result types (string, number, boolean, null, undefined)
- **Context Preservation**: Maintains code structure and comments

### Configuration System

The tool uses a comprehensive configuration object with CLI-driven parameters:

```javascript
const config = {
  decryptStringReverse: true,      // Process string reverse operations
  decryptFunctionCalls: true,       // Process function calls
  verbose: false,                   // Verbose output
  debug: false,                     // Debug mode with tracing
  interceptPattern: /f\d*/,         // Function name pattern
  minArgs: 4,                       // Minimum function arguments
  maxArgs: 6,                       // Maximum function arguments
  cleanupFunctions: 'none'          // Function cleanup mode
};
```

### Sample Files

- `sample.js`, `sample2.js`, `sample3.js`: Example obfuscated JavaScript files for testing
- `a.js`: Additional test file

## Common Development Tasks

### Adding New Function Patterns
1. Modify the `interceptPattern` regex in the configuration
2. Update argument count constraints in `minArgs`/`maxArgs`
3. Test with sample files

### Debugging Function Execution
```bash
node de.js -f input.js -d --output-debug debug.log
```

### Extending String Processing
- Add new string transformation patterns to `processStringReverse` function
- Ensure pattern matching and replacement logic is robust

### Modifying AST Processing
- Work with Babel AST nodes in `applyCallExpressionReplacements`
- Use Babel's traverse and generate functions for AST manipulation

## Important Code Patterns

### Function Dependency Resolution
The tool implements a topological sort algorithm to handle function dependencies:
```javascript
function topologicalSort(graph) {
  // Ensures functions are extracted in dependency order
}
```

### Safe Function Execution
Functions are executed in a controlled VM environment with error handling:
```javascript
function safeCall(func, args, callStr) {
  // Wraps function calls with timing and error handling
}
```

### AST-Based Transformation
Code modifications are performed at the AST level for precision:
```javascript
function applyCallExpressionReplacements(code, callExpressionMap) {
  // Uses Babel AST to replace call expressions with computed values
}
```

## Testing and Validation

Use the provided sample files to test changes:
```bash
node de.js -f sample.js -v
node de.js -f sample2.js -o sample2_decrypted.js
node de.js -f sample3.js -d --function-name "f[0-9]+"
```

## Performance Considerations

- The tool is designed for batch processing of obfuscated JavaScript files
- VM execution adds overhead but ensures safety
- AST manipulation is memory-intensive for large files
- Consider file size when processing large codebases

## Security Notes

- The tool runs in a sandboxed VM environment
- Only processes JavaScript code - no file system or network access
- Use caution when processing untrusted code
- Default timeout prevents infinite execution

# Codebuddy - 开发规范与测试指南

## 📋 项目概述

本项目是一个JavaScript依赖分析工具，主要功能包括：
- 函数依赖关系分析
- 参数依赖检测
- 立即执行函数清理
- 业务逻辑保护
- 导出函数检测

## 🏗️ 项目结构

```
webfunny_dejs/
├── de.js                    # 主程序文件
├── tests/                   # 测试框架
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   ├── functional/          # 功能测试
│   ├── regression/         # 回归测试
│   └── fixtures/           # 测试数据
├── package.json            # 项目配置
└── Codebuddy.md           # 开发规范（本文档）
```

## 🧪 测试框架说明

### 测试目录结构

```
tests/
├── unit/                   # 单元测试
│   ├── core/              # 核心功能测试
│   │   └── dependency-analysis.test.js
│   ├── utils/             # 工具函数测试
│   │   └── function-extraction.test.js
│   └── validation/        # 验证逻辑测试
│       └── export-detection.test.js
├── integration/           # 集成测试
│   └── dependency/        # 依赖分析集成测试
│       └── parameter-dependency.test.js
├── functional/            # 功能测试
│   └── basic/            # 基本功能测试
│       └── cleanup-functionality.test.js
├── regression/            # 回归测试
│   └── fixed-bugs/       # 已修复bug测试
│       └── export-detection-bug.test.js
└── fixtures/              # 测试数据
    ├── input/            # 输入文件
    └── expected/         # 预期输出
```

### 测试运行命令

```bash
# 安装测试依赖
npm install --save-dev jest mocha chai

# 运行所有测试
npm test

# 运行特定类型测试
npm run test:unit          # 单元测试
npm run test:integration   # 集成测试
npm run test:functional    # 功能测试
npm run test:regression    # 回归测试

# 生成覆盖率报告
npm run test:coverage

# 监视模式运行测试
npm run test:watch
```

## 🔧 开发规范

### 1. 代码风格规范

#### 命名约定
- **函数名**: 使用camelCase，动词开头
  ```javascript
  // ✅ 正确
  function analyzeDependencies() {}
  function extractFunctionCalls() {}
  
  // ❌ 错误
  function dependency_analysis() {}
  function ExtractFunctionCalls() {}
  ```

- **变量名**: 使用camelCase，描述性名称
  ```javascript
  // ✅ 正确
  const functionDependencyGraph = new Map();
  const immediateFunctionCalls = new Set();
  
  // ❌ 错误
  const graph = new Map();
  const set = new Set();
  ```

- **常量**: 使用UPPER_SNAKE_CASE
  ```javascript
  const MAX_DEPTH = 10;
  const DEFAULT_CONFIG = {};
  ```

#### 代码结构
- 每个函数不超过50行
- 使用JSDoc注释说明函数功能
- 导出函数必须有详细注释

```javascript
/**
 * 分析函数依赖关系
 * @param {string} code - 源代码
 * @returns {Map} 依赖关系图
 */
function analyzeFunctionDependencies(code) {
  // 函数实现
}
```

### 2. 测试规范

#### 测试文件命名
- 单元测试: `[功能名].test.js`
- 集成测试: `[集成场景].test.js`
- 功能测试: `[功能描述].test.js`

#### 测试结构
```javascript
describe('功能模块名称', () => {
  describe('具体场景', () => {
    test('应该完成特定行为', () => {
      // 准备
      const input = '测试输入';
      
      // 执行
      const result = functionUnderTest(input);
      
      // 断言
      expect(result).toBe(expected);
    });
  });
});
```

#### 测试覆盖率要求
- 单元测试覆盖率 ≥ 90%
- 核心功能覆盖率 100%
- 集成测试覆盖主要流程

### 3. 依赖分析功能开发指南

#### 核心功能模块

1. **参数依赖检测** (`collectParameterDependencies`)
   ```javascript
   // 检测模式: f2(f1) 这种参数传递
   function collectParameterDependencies(code) {
     // 实现逻辑
   }
   ```

2. **依赖图构建** (`buildFunctionDependencyGraph`)
   ```javascript
   // 构建完整的函数依赖关系图
   function buildFunctionDependencyGraph(code) {
     // 实现逻辑
   }
   ```

3. **拓扑排序** (`topologicalSort`)
   ```javascript
   // 确保依赖关系的正确顺序
   function topologicalSort(dependencyGraph) {
     // 实现逻辑
   }
   ```

#### 业务逻辑保护

```javascript
// 保护被业务逻辑使用的函数
function protectBusinessLogicFunctions(code, dependencyGraph) {
  // 1. 检测导出函数
  // 2. 检测require之后的调用
  // 3. 保护依赖链
}
```

#### 清理策略

```javascript
// 安全清理策略
function safeCleanupStrategy(code, cleanupData) {
  // 1. 清理立即执行函数（require之前）
  // 2. 按拓扑顺序清理函数
  // 3. 保留业务逻辑函数
}
```

### 4. 错误处理规范

#### 异常分类
```javascript
class DependencyAnalysisError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// 具体错误类型
const ERROR_CODES = {
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INVALID_SYNTAX: 'INVALID_SYNTAX',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY'
};
```

#### 错误处理模式
```javascript
function analyzeCode(code) {
  try {
    // 分析逻辑
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DependencyAnalysisError(
        '代码语法错误', 
        ERROR_CODES.INVALID_SYNTAX
      );
    }
    throw error;
  }
}
```

### 5. 性能优化指南

#### 内存优化
```javascript
// 使用Set和Map而不是数组
const functionSet = new Set();        // ✅ 高效
const functionArray = [];            // ❌ 低效

// 及时清理不再使用的数据
function processCode(code) {
  const ast = parse(code);
  // ... 处理逻辑
  // 及时清理AST等大型对象
  ast = null;
}
```

#### 算法优化
```javascript
// 使用高效的依赖检测算法
function optimizeDependencyDetection(code) {
  // 使用缓存避免重复计算
  // 使用增量更新减少计算量
}
```

### 6. 调试与日志规范

#### 调试模式
```javascript
const config = {
  debug: process.env.DEBUG === 'true',
  verbose: process.env.VERBOSE === 'true'
};

function debugLog(message, data) {
  if (config.debug) {
    console.log(`[DEBUG] ${message}`, data);
  }
}
```

#### 结构化日志
```javascript
function logAnalysisProgress(step, data) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    step: step,
    data: data
  }));
}
```

## 🚀 开发流程

### 1. 功能开发流程

1. **需求分析**
   - 明确功能需求
   - 设计API接口
   - 制定测试计划

2. **测试驱动开发**
   ```bash
   # 1. 编写测试
   npm run test:unit -- --watch
   
   # 2. 实现功能
   # 3. 运行测试直到通过
   ```

3. **集成测试**
   ```bash
   # 运行集成测试确保模块协作正常
   npm run test:integration
   ```

4. **代码审查**
   - 检查代码规范
   - 验证测试覆盖率
   - 确保文档完整性

### 2. Bug修复流程

1. **重现问题**
   - 创建最小重现用例
   - 添加到回归测试

2. **分析原因**
   - 使用调试工具定位问题
   - 分析依赖关系

3. **修复并测试**
   ```bash
   # 修复bug
   # 运行相关测试
   npm run test:regression
   
   # 确保没有破坏现有功能
   npm run test:all
   ```

### 3. 性能优化流程

1. **性能分析**
   ```bash
   # 使用性能分析工具
   node --prof de.js -f large-file.js
   ```

2. **优化实施**
   - 识别性能瓶颈
   - 实现优化方案

3. **性能测试**
   ```bash
   # 性能基准测试
   npm run test:performance
   ```

## 📊 质量指标

### 代码质量
- 测试覆盖率 ≥ 90%
- 代码重复率 ≤ 5%
- 函数复杂度 ≤ 10

### 性能指标
- 大型文件处理时间 < 10秒
- 内存使用 < 500MB
- CPU使用率 < 80%

### 稳定性指标
- 回归测试通过率 100%
- 关键功能测试通过率 100%
- 错误处理覆盖率 100%

## 🔄 持续集成

### GitHub Actions配置
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 📚 学习资源

### 相关技术
- [Babel AST](https://babeljs.io/docs/en/babel-parser)
- [JavaScript 依赖分析](https://github.com/estools)
- [测试驱动开发](https://jestjs.io/)

### 最佳实践
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**维护者**: 开发团队  
**最后更新**: 2024年  
**版本**: 1.0.0