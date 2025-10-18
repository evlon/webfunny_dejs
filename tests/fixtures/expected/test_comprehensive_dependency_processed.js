// 综合测试文件：验证所有依赖分析场景
// 1. 参数依赖 (f2(f1))
// 2. 嵌套依赖 (f3 -> f1, f2)
// 3. 立即执行函数依赖
// 4. 业务逻辑保护
// 5. 清理边界验证

// === 第一部分：依赖关系定义 ===

// 基础函数定义
function f1(a, b, c, d) {
  console.log("f1 called with:", a, b, c, d);
  return a + b + c + d;
}

// 参数依赖：f2 的参数引用了函数 f1
function f2(func) {
  console.log("f2 called with function:", func.name);
  return func(1, 2, 3, 4);
}

// 嵌套调用依赖：f3 调用了 f1 和 f2

// 内部调用依赖
function f4(a, b, c, d) {
  return f1(a, b, c, d) * 2;
}

// 函数表达式
var f5 = function (p1, p2, p3, p4) {
  return f4(p1, p2, p3, p4) + 100;
};

// === 第二部分：初始化代码（应该被清理） ===

// 立即执行函数1 - 在require之前

// 立即执行函数2 - 在require之前  
!function () {
  console.log("初始化函数2 - 应该被清理");
  const value = f2(f1);
  return value;
}();

// === 第三部分：模块导入（清理边界） ===

const fs = require('fs');
const path = require('path');

// === 第四部分：业务逻辑代码（不应该被清理） ===

// 业务逻辑中的函数调用
function businessLogic1() {
  console.log("业务逻辑1执行");
  const data = 110;
  return data;
}

// 另一个业务逻辑函数
function businessLogic2() {
  console.log("业务逻辑2执行");
  return 52;
}

// require之后的立即执行函数（不应该被清理）
(function () {
  console.log("业务逻辑立即函数 - 不应该被清理");
  const result = f5(1, 1, 1, 1);
  return result;
})();

// 对象属性中的函数调用（业务逻辑）
const config = {
  setting1: 10,
  setting2: f2(f1),
  setting3: 20
};

// 数组中的函数调用（业务逻辑）
const settings = ["setting1", 20, "setting2"];

// === 第五部分：导出和业务逻辑（明确保护） ===

// 导出的函数（明确不应该被清理）
module.exports = {
  f1: f1,
  f3: f3,
  businessLogic1: businessLogic1,
  businessLogic2: businessLogic2,
  config: config,
  settings: settings
};

// 导出后的函数调用（不应该被清理）
const result = businessLogic1();
console.log("最终结果:", result);