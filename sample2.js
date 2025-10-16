// 测试依赖关系的JavaScript代码

function f123(a, b, c, d) {
  return a + b + c + d;
}
function f456(x, y, z, w) {
  return f123(x, y, z, w) * 2; // f456依赖f123
}
function f789(p, q, r, s) {
  return f456(p, q, r, s) + f123(p, q, r, s); // f789依赖f456和f123
}

// 立即执行函数，包含函数调用
(function () {
  var result1 = f123(1, 2, 3, 4);
  var result2 = f456(5, 6, 7, 8);
  var result3 = f789(9, 10, 11, 12);
  console.log("初始化结果:", result1, result2, result3);
})();

// 普通的函数调用
var finalResult = 30;