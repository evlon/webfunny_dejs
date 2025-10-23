// 测试清理依赖关系的文件

// 立即执行函数（应该被清理）
(function () {
  console.log("初始化函数");
  const result = f1(1, 2, 3, 4);
  return result;
})();

// 函数定义
function f1(a, b, c, d) {
  // 调用f2，形成依赖关系
  return f2(a + b, c + d);
}
function f2(x, y) {
  // 调用f3，形成依赖关系
  return f3(x, y);
}
function f3(p, q) {
  // 独立函数
  return p * q;
}
function f4() {
  // 被f5调用的函数
  return "不应该被清理";
}
function f5() {
  // 业务逻辑函数（不应该被清理）
  return "\u4E0D\u5E94\u8BE5\u88AB\u6E05\u7406";
}

// 模块导入
const fs = require('fs');

// 业务逻辑代码（不应该被清理）
const data = fs.readFileSync('test.txt', 'utf8');
console.log("\u4E0D\u5E94\u8BE5\u88AB\u6E05\u7406");