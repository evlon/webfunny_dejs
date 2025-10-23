// 第二个立即执行函数（应该被清理）
!function () {
  console.log("初始化函数2 - 在require之前");
  const value = f2(f1);
  return value;
}();

// 模块导入
const fs = require('fs');

// require之后的立即执行函数（不应该被清理）
(function () {
  console.log("业务逻辑函数 - 在require之后");
  const data = fs.readFileSync('test.txt', 'utf8');
  return f3(data, 2, 3, 4);
})();

// 函数定义
function f1(a, b, c, d) {
  return a + b + c + d;
}
function f2(func) {
  return func(1, 2, 3, 4);
}
// 另一个require
const path = require('path');

// 另一个require之后的立即执行函数（不应该被清理）
+function () {
  console.log("另一个业务函数 - 在require之后");
  return f2(f1);
}();