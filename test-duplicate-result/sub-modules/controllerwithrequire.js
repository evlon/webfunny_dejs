/**
 * ControllerWithRequire 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

// 全局声明
// 使用不同的变量名避免语法错误

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

const vRequire8 = require('../../util/status-code');

// ControllerWithRequire 控制器类
class ControllerWithRequire {
  constructor() {
    this.config = globalConfig;
  }
  static process() {
    // 使用全局变量和require导入的变量
    return helperFunction() + ' - ' + globalConfig.appName;
  }
  useRequire() {
    // 使用require导入的变量
    return vRequire8.someMethod();
  }
}

module.exports = { ControllerWithRequire };
