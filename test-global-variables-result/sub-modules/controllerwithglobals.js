/**
 * ControllerWithGlobals 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

// 全局声明
/**
 * 测试全局变量处理
 */

// 全局变量声明
const globalConfig = {
  appName: 'MyApp',
  version: '1.0.0'
};

// 全局函数
// 全局函数
function helperFunction() {
  return 'helper result';
}

// ControllerWithGlobals 控制器类
class ControllerWithGlobals {
  constructor() {
    this.config = globalConfig; // 使用全局变量
  }
  static getInfo() {
    return helperFunction() + ' - ' + globalConfig.appName; // 使用全局变量和函数
  }
  instanceMethod() {
    // 使用全局变量
    console.log('App:', globalConfig.appName, 'Version:', globalConfig.version);
  }
}

// 另一个全局变量

module.exports = { ControllerWithGlobals };
