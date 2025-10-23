# 测试用例框架说明

## 📋 目录结构

```
tests/
├── unit/                 # 单元测试
│   ├── core/            # 核心功能单元测试
│   ├── utils/           # 工具函数单元测试
│   └── validation/       # 验证逻辑单元测试
├── integration/         # 集成测试
│   ├── dependency/      # 依赖分析集成测试
│   ├── cleanup/         # 清理功能集成测试
│   └── export/          # 导出检测集成测试
├── functional/          # 功能测试
│   ├── basic/           # 基本功能测试
│   ├── advanced/        # 高级功能测试
│   └── edge-cases/      # 边界情况测试
├── regression/          # 回归测试
│   ├── fixed-bugs/      # 已修复bug测试
│   └── performance/     # 性能回归测试
├── fixtures/            # 测试数据
│   ├── input/           # 输入测试文件
│   └── expected/        # 预期输出文件
├── utils/               # 测试工具
│   ├── test-runner.js   # 测试运行器
│   ├── assertions.js    # 断言库
│   └── helpers.js       # 测试辅助函数
├── reports/             # 测试报告
│   ├── coverage/        # 覆盖率报告
│   └── performance/     # 性能报告
└── config/              # 测试配置
    ├── jest.config.js   # Jest配置
    └── mocha.config.js  # Mocha配置
```

## 🎯 测试策略

### 测试级别
1. **单元测试**: 测试单个函数/模块的独立功能
2. **集成测试**: 测试模块间的交互和依赖关系
3. **功能测试**: 测试完整功能流程
4. **回归测试**: 确保修复的bug不再出现

### 测试目标
- 代码覆盖率 > 90%
- 关键功能测试覆盖率 100%
- 自动化测试执行时间 < 5分钟
- 支持持续集成

## 🚀 快速开始

### 安装依赖
```bash
npm install --save-dev jest mocha chai sinon nyc
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行功能测试
npm run test:functional

# 生成覆盖率报告
npm run test:coverage
```

## 📊 测试报告

测试完成后将生成以下报告：
- HTML覆盖率报告
- 控制台测试结果摘要
- 性能基准比较
- 历史趋势分析

## 🔧 自定义配置

在 `tests/config/` 目录中修改配置文件来自定义测试行为。