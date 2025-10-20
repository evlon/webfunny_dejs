/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: test-static-method.js
 * 拆分时间: 2025-10-19T16:40:56.834Z
 * 控制器模块目录: sub-modules/
 */

const controller1 = require('./sub-modules/controller1');
const controller2 = require('./sub-modules/controller2');

module.exports = {
  Controller1: controller1.Controller1,
  Controller2: controller2.Controller2,
};
