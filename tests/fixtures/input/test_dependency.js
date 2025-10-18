// 测试依赖分析的文件
function f1(a, b, c, d) {
  return a + b + c + d;
}
function f2(func) {
  // 参数依赖：f2 的参数引用了函数 f1
  return func(1, 2, 3, 4);
}
function f3(x, y, z, w) {
  // 嵌套调用依赖：f3 调用了 f1 和 f2
  const result1 = f1(x, y, z, w);
  const result2 = f2(f1); // 参数传递函数引用
  return result1 + result2;
}
function f4(a, b, c, d) {
  // 内部调用依赖
  return f1(a, b, c, d) * 2;
}

// 立即执行函数中的依赖
(function () {
  const result = 20;
  console.log("初始化结果:", result);
})();

// 变量声明中的函数表达式
var f5 = function (p1, p2, p3, p4) {
  return f4(p1, p2, p3, p4) + 100;
};

// 数组中的函数调用
const arr = [10, f2(f1), 20];

// 对象属性中的函数调用
const obj = {
  prop1: 10,
  prop2: f2(f1),
  prop3: 20
};

// 赋值表达式中的函数调用
let value1 = 10;
let value2 = f2(f1);
let value3 = 20;