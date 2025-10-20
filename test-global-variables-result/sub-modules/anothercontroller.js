/**
 * AnotherController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

// 全局声明
// 全局函数
function helperFunction() {
  return 'helper result';
}
// 另一个全局变量
const anotherGlobal = 'test value';

// AnotherController 控制器类
class AnotherController {
  static process() {
    return helperFunction() + ' - ' + anotherGlobal; // 使用全局变量和函数
  }
}

module.exports = { AnotherController };
