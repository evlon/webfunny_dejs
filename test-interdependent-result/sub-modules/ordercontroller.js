/**
 * OrderController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

const ProductController = require('../sub-modules/productcontroller').ProductController;

// OrderController 控制器类
class OrderController {
  constructor() {
    this.productService = new ProductController();
  }
  getOrdersByUser(userId) {
    // 这里应该调用UserController，但为了演示直接返回
    return [{
      id: 1,
      userId: userId,
      productId: 101,
      status: 'completed'
    }, {
      id: 2,
      userId: userId,
      productId: 102,
      status: 'pending'
    }];
  }
  processOrder(orderId) {
    const order = this.getOrderById(orderId);
    const product = this.productService.getProduct(order.productId);
    return {
      order,
      product
    };
  }
  getOrderById(id) {
    return {
      id,
      productId: 101,
      status: 'pending'
    };
  }

  // 引用ProductController的方法
  validateProduct(productId) {
    return this.productService.validateProduct(productId);
  }
}

module.exports = { OrderController };
