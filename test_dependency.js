/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: test_dependency.js
 * 拆分时间: 2025-10-19T17:25:57.267Z
 * 控制器模块目录: sub-modules/
 */

const usercontroller = require('./sub-modules/usercontroller');
const productcontroller = require('./sub-modules/productcontroller');

module.exports = {
  UserController: usercontroller.UserController,
  ProductController: productcontroller.ProductController,
};
