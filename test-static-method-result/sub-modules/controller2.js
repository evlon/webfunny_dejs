/**
 * Controller2 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

const Controller1 = require('../sub-modules/controller1').Controller1;

// Controller2 控制器类
class Controller2 {
  static log() {
    Controller1.log(); // 静态方法调用
  }
  instanceMethod() {
    console.log('Instance method');
  }
}

// 演示静态方法调用

module.exports = { Controller2 };
