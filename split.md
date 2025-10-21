
## 代码分割设计

如果一个语句A被保留了，那么A依赖的语句B也必须保留，形成依赖链。让我重新设计：## 🎯 核心改进：完整依赖链追踪

现在的策略更加可靠了！主要改进：

### 1. **依赖链完整性保证**

```javascript
// 原文件中的依赖关系：
const vRequire22 = require("./config");        // 语句A
const { accountInfo } = vRequire22;             // 语句B (依赖A)
const v45 = accountInfo.enable ? new X() : null; // 语句C (依赖B)

class MyController {
  method() {
    console.log(v45); // 使用 v45
  }
}

// 新算法的处理：
// 1. 发现类使用了 v45
// 2. 追踪到 v45 由语句C声明
// 3. 发现语句C使用了 accountInfo
// 4. 追踪到 accountInfo 由语句B声明
// 5. 发现语句B使用了 vRequire22
// 6. 追踪到 vRequire22 由语句A声明
// 7. 保留语句A、B、C（完整依赖链）
```

### 2. **智能标识符提取**

改进了对各种语法的支持：

```javascript
// ✅ 简单变量
const a = 1;  // 声明: a

// ✅ 解构赋值
const { x, y } = obj;  // 声明: x, y

// ✅ 数组解构
const [a, b] = arr;  // 声明: a, b

// ✅ 嵌套解构
const { a: { b, c } } = obj;  // 声明: b, c

// ✅ 剩余参数
const { a, ...rest } = obj;  // 声明: a, rest
```

### 3. **依赖追踪算法**

使用广度优先搜索（BFS）追踪依赖链：

```javascript
function calculateRequiredStatements(classCode, globalStatements) {
  // 1. 构建依赖图：每个语句 -> {声明了什么, 使用了什么}
  const graph = buildDependencyGraph();
  
  // 2. 找出类直接使用的标识符
  const classUsed = extractUsedIdentifiers(classCode);
  
  // 3. BFS 追踪依赖链
  const queue = new Set(classUsed);
  const required = new Set();
  
  while (queue.size > 0) {
    const identifier = queue.values().next().value;
    queue.delete(identifier);
    
    // 找到声明这个标识符的语句
    for (const [index, info] of graph) {
      if (info.declares.has(identifier)) {
        required.add(index);  // 保留这个语句
        
        // 将这个语句使用的标识符加入队列
        info.uses.forEach(used => queue.add(used));
      }
    }
  }
  
  return required;
}
```

### 4. **处理你的例子**

对于你提供的复杂代码：

```javascript
// 原文件
const { accountInfo } = vRequire22;                    // 语句1
const vRequire25 = require("../config/consts");        // 语句2
const { MANAGE_API } = vRequire25;                     // 语句3
const { transliteration, slugify } = require("trans"); // 语句4
const vRequire26 = require("../config/constMsg");      // 语句5
const v45 = accountInfo.messageQueue.enable === true 
  ? new vRequire23() 
  : null;                                               // 语句6

class MyController {
  method() {
    slugify(MANAGE_API);  // 使用 slugify 和 MANAGE_API
  }
}

// 追踪过程：
// 1. 类使用了: slugify, MANAGE_API
// 2. slugify 由语句4声明 -> 保留语句4
// 3. MANAGE_API 由语句3声明，使用了 vRequire25 -> 保留语句3
// 4. vRequire25 由语句2声明 -> 保留语句2
// 5. 最终保留: 语句2, 3, 4（完整依赖链）
```

### 5. **保守策略**

对于难以分析的情况，采取保守策略：

```javascript
// 这些情况下，宁可多保留
try {
  // 尝试精确分析
  const used = extractUsedIdentifiers(statement);
} catch (error) {
  // 分析失败，保留这个语句（保守策略）
  console.warn('⚠️  分析失败，保留该语句');
  return true; // 保留
}
```

### 6. **详细的日志输出**

```bash
📝 生成模块: UserController
  📌 类直接使用的标识符 (5): vRequire22, MANAGE_API, slugify...
  🔍 分析依赖链...
  ✓ 需要保留 3/10 个语句（包含完整依赖链）
  🔗 引用的控制器: AuthController
  ✅ 添加了 3 个语句
```

### 7. **核心保证**

✅ **完整性**：如果 A 被保留，A 依赖的 B 也会被保留  
✅ **顺序性**：保持原文件的语句顺序  
✅ **兼容性**：支持所有 JS 语法（解构、复杂表达式等）  
✅ **安全性**：宁可冗余，不能遗漏  

这个方案应该能够可靠地处理各种复杂情况了！


## 上个版本的方案
你的建议非常好！这是一个更可靠的拆分策略。让我重新设计一个基于"先全量复制，再按需删除"的方案：## 新策略的核心优势

这个重新设计的方案采用了你建议的 **"全量复制 + 智能清理"** 策略：

### 🎯 核心思路

1. **全量复制阶段**
   - 将原文件中的所有全局语句（require、变量、函数等）按原始顺序复制到每个子模块
   - 保持所有语句的原始格式和顺序
   - 不做任何修改或重排

2. **补充依赖阶段**
   - 检测当前类引用了哪些其他控制器
   - 添加子模块间的 `require` 语句

3. **智能清理阶段**
   - 删除确认不被当前类使用的语句
   - 保留所有可能被使用的代码（宁可多留，不能少留）

### ✅ 解决的问题

你提到的复杂情况现在都能正确处理：

```javascript
// 1. 复杂的解构赋值 - ✅ 按原样复制
const { accountInfo } = vRequire22;

// 2. 链式 require - ✅ 按原样复制
const vRequire25 = require("../config/consts");
const { MANAGE_API } = vRequire25;

// 3. 多层解构 - ✅ 按原样复制
const { transliteration, slugify } = require("transliteration");

// 4. 复杂表达式赋值 - ✅ 按原样复制
const v45 = accountInfo.messageQueue.enable === true 
  ? new vRequire23() 
  : null;

// 5. 立即执行函数 - ✅ 按原样复制
(function() {
  // ...
})();

// 6. 复杂的对象字面量 - ✅ 按原样复制
const config = {
  ...defaultConfig,
  [dynamicKey]: value
};
```

### 🔍 智能清理逻辑

清理策略非常保守，只删除明确不需要的：

```javascript
function isStatementUsedByClass(statement, classCode, allControllerNames) {
  // 1. 如果是其他类的定义 -> 删除
  // 2. 如果是变量/函数且未被引用 -> 删除
  // 3. 其他所有情况（包括复杂表达式）-> 保留
}
```

### 📊 优势对比

| 特性 | 旧方案（依赖分析） | 新方案（全量复制） |
|------|------------------|------------------|
| 复杂解构 | ❌ 可能出错 | ✅ 完全支持 |
| 表达式赋值 | ❌ 难以处理 | ✅ 完全支持 |
| 顺序保证 | ⚠️ 需要复杂排序 | ✅ 保持原样 |
| 立即执行函数 | ❌ 难以分析 | ✅ 完全支持 |
| 代码冗余 | ✅ 最小化 | ⚠️ 可能有冗余 |
| 可靠性 | ⚠️ 依赖分析准确性 | ✅ 非常高 |

### 💡 使用示例

```bash
# 基本使用
node split.js controllers.js

# 指定输出目录
node split.js controllers.js ./output

# 不创建备份
node split.js controllers.js ./output --no-backup
```

### 📝 输出示例

对于你的例子，生成的模块会是：

```javascript
/**
 * SomeController 控制器模块
 */

// 全部按原始顺序复制
const { accountInfo } = vRequire22;
const vRequire25 = require("../config/consts");
const { MANAGE_API } = vRequire25;
const { transliteration, slugify } = require("transliteration");
const vRequire26 = require("../config/constMsg");
const v45 = accountInfo.messageQueue.enable === true ? new vRequire23() : null;

// 如果引用了其他控制器
const OtherController = require('./othercontroller').OtherController;

// SomeController 控制器类
class SomeController {
  // ...
}

module.exports = { SomeController };
```

这个方案的哲学是：**宁可保留不需要的代码（稍微冗余），也不能遗漏需要的代码（导致运行错误）**。你觉得这个方案如何？