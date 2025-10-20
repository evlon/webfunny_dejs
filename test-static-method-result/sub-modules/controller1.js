/**
 * Controller1 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

// Controller1 控制器类
/**
 * 测试静态方法引用
 */

class Controller1 {
  static log() {
    console.log('Controller1 logging');
  }
}

module.exports = { Controller1 };
