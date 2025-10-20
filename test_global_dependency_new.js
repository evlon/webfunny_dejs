/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: test_global_dependency_new.js
 * 拆分时间: 2025-10-19T17:36:55.563Z
 * 控制器模块目录: sub-modules/
 */

const usercontroller = require('./sub-modules/usercontroller');
const authcontroller = require('./sub-modules/authcontroller');

module.exports = {
  UserController: usercontroller.UserController,
  AuthController: authcontroller.AuthController,
};
