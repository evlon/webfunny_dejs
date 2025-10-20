/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: test-global-variables.js
 * 拆分时间: 2025-10-19T17:07:00.053Z
 * 控制器模块目录: sub-modules/
 */

const controllerwithglobals = require('./sub-modules/controllerwithglobals');
const anothercontroller = require('./sub-modules/anothercontroller');

module.exports = {
  ControllerWithGlobals: controllerwithglobals.ControllerWithGlobals,
  AnotherController: anothercontroller.AnotherController,
};
