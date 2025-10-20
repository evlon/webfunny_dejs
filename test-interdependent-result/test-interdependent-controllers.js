/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: test-interdependent-controllers.js
 * 拆分时间: 2025-10-19T15:51:31.190Z
 * 控制器模块目录: sub-modules/
 */

const usercontroller = require('./sub-modules/usercontroller');
const ordercontroller = require('./sub-modules/ordercontroller');
const productcontroller = require('./sub-modules/productcontroller');

module.exports = {
  UserController: usercontroller.UserController,
  OrderController: ordercontroller.OrderController,
  ProductController: productcontroller.ProductController,
};
