# webfunny_dejs

运行时函数解密工具 - 用于分析和解密JavaScript代码中的混淆函数

## 功能概述

`de.js` 是一个功能强大的JavaScript代码分析工具，专门用于：

- 🔍 **AST代码分析** - 使用Babel解析器深度分析JavaScript抽象语法树
- 🎯 **函数提取** - 自动识别和提取符合特定模式的混淆函数
- 💡 **常量分析** - 找出使用常量参数调用的函数调用
- 🔄 **运行时解密** - 在隔离VM环境中执行函数，获取实际返回值
- ✂️ **代码简化** - 将函数调用替换为计算后的常量值，简化代码逻辑

## 快速开始

### 安装依赖

```bash
npm install
```

### 安装 webcrack（可选但推荐）

webcrack 是一个强大的 JavaScript 反混淆工具，可以与 webfunny_dejs 配合使用。

```bash
# 使用 npm 全局安装
npm install -g webcrack

# 或使用 npx（推荐，无需安装）
npx webcrack your_script.js
```

### 使用方法

```bash
# 基本用法
node de.js -f your_script.js

# 指定输出文件
node de.js -f input.js -o output.js

# 启用详细模式
node de.js -f input.js -v

# 启用调试模式（记录函数调用过程）
node de.js -f input.js -d

# 指定要处理的函数名模式
node de.js -f input.js --function-name "f\\d+"
```

## 参数说明

| 参数 | 别名 | 说明 | 默认值 |
|------|------|------|--------|
| `--file` | `-f` | 待处理的文件路径 | 必需 |
| `--output` | `-o` | 输出文件路径 | 原文件路径 |
| `--backup` | `-b` | 是否创建备份文件 | true |
| `--verbose` | `-v` | 详细输出模式 | false |
| `--debug` | `-d` | 调试模式，记录运行时变量状态 | false |
| `--intercept-pattern` | | 函数名匹配模式（正则表达式） | `f\\d+` |
| `--function-name` | | 指定要调试的函数名称（正则表达式） | 所有匹配 |
| `--min-args` | | 最小参数个数 | 4 |
| `--max-args` | | 最大参数个数 | 6 |

## 其他工具集成

### webcrack 集成使用

webcrack 是一个强大的 JavaScript 反混淆工具，可以作为 webfunny_dejs 的前置处理步骤，显著提高反混淆效果。

#### 安装 webcrack

```bash
# 使用 npm 全局安装
npm install -g webcrack

# 或使用 npx（推荐，无需安装）
npx webcrack your_script.js
```

#### 使用 webcrack 进行预处理

```bash
# 1. 首先使用 webcrack 进行初步反混淆
webcrack input.js -o intermediate.js

# 2. 然后使用 webfunny_dejs 进行深度分析
node de.js -f intermediate.js -o output.js

# 或使用单行命令组合
webcrack input.js -o intermediate.js && node de.js -f intermediate.js -o output.js
```

#### webcrack 主要功能

- 🔍 **AST 解混淆** - 还原压缩的变量名和函数名
- 🔄 **控制流平坦化** - 还原复杂的控制流结构
- 💡 **常量传播** - 还原常量表达式
- 🧩 **字符串解密** - 解密加密的字符串
- 📊 **代码美化** - 格式化代码结构

#### webcrack 与 webfunny_dejs 配合使用的工作流程

```bash
# 完整反混淆流程
webcrack encrypted.js -o step1.js                    # 初步解混淆
node de.js -f step1.js -o step2.js -v -d             # 运行时函数解密
webcrack step2.js -o final.js --beautify            # 最终美化
```

#### webcrack 常用参数

```bash
# 基本用法
webcrack input.js -o output.js

# 美化输出
webcrack input.js -o output.js --beautify

# 解混淆特定模式
webcrack input.js -o output.js --string-array

# 详细模式
webcrack input.js -o output.js --verbose
```

### 工具对比

| 工具 | 主要功能 | 适用场景 |
|------|----------|----------|
| **webfunny_dejs** | 运行时函数解密、常量替换、依赖分析 | 处理复杂的运行时加密函数 |
| **webcrack** | AST解混淆、控制流还原、字符串解密 | 处理压缩和混淆的结构化代码 |

## 工作原理

### 1. AST分析阶段
工具使用Babel解析器构建代码的抽象语法树，深度分析函数定义和调用关系。

### 2. 函数提取
识别符合模式（如`f123`, `f456`等）的函数定义，分析其依赖关系。

### 3. 调用分析
找出所有使用常量参数调用的函数，过滤掉非常量参数调用。

### 4. VM执行
在安全的Node.js VM环境中执行提取的函数，捕获实际返回值。

### 5. 代码替换
将成功的函数调用替换为计算后的常量值，简化代码逻辑。

## 高级功能

### 字符串反序解密
自动处理字符串反序操作：
```javascript
// 原始代码
"hello".split("").reverse().join("")

// 处理后
"olleh"
```

### 函数清理
支持清理已解密的函数：
- `none`: 不清理
- `comment`: 注释掉函数
- `remove`: 删除函数

### 调试支持
启用调试模式后可：
- 记录函数调用过程
- 保存调试日志到文件
- 分析函数调用差异

## 示例

### 输入代码
```javascript
function f123(a, b, c, d) {
    return a + b + c + d;
}

// 调用
var result = f123(1, 2, 3, 4);
```

### 处理后代码
```javascript
// 函数定义被清理（可选）
/* [解密清理] 已解密的函数: f123 */

// 调用被替换为实际值
var result = 10;
```

## 应用场景

- 🔒 **代码反混淆** - 分析被混淆的JavaScript代码
- 📊 **性能优化** - 将运行时计算替换为编译时常量
- 🕵️ **安全审计** - 分析恶意代码的行为逻辑
- 🧪 **代码分析** - 理解复杂代码的执行流程

## 技术栈

- **Node.js** - 运行时环境
- **Babel Parser** - JavaScript语法分析
- **Babel Traverse** - AST遍历
- **Babel Generator** - 代码生成
- **yargs** - 命令行参数解析

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具。