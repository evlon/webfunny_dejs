/**
 * UserController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

const OrderController = require('../sub-modules/ordercontroller').OrderController;
const ProductController = require('../sub-modules/productcontroller').ProductController;

// UserController 控制器类
class UserController {
  constructor() {
    this.orderService = new OrderController();
    this.productService = new ProductController();
  }
  getUserOrders(userId) {
    const user = this.getUserById(userId);
    const orders = this.orderService.getOrdersByUser(userId);
    return {
      user,
      orders
    };
  }
  getUserById(id) {
    return {
      id,
      name: 'User ' + id
    };
  }

  // 引用另一个控制器的方法
  processOrder(orderId) {
    return this.orderService.processOrder(orderId);
  }
}

module.exports = { UserController };
