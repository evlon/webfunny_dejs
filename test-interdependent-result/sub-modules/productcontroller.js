/**
 * ProductController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

// ProductController 控制器类
class ProductController {
  getProduct(productId) {
    return {
      id: productId,
      name: 'Product ' + productId,
      price: 99.99
    };
  }
  validateProduct(productId) {
    return productId > 0;
  }

  // 引用OrderController的方法来检查订单状态
  getProductOrders(productId) {
    // 这里应该调用OrderController的方法，但为了演示直接返回
    return [{
      orderId: 1,
      userId: 1
    }];
  }
}

// 演示相互引用

module.exports = { ProductController };
