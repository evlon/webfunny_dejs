/**
 * 测试子模块间引用的测试用例
 * 这个文件模拟一个包含多个相互引用类的控制器脚本
 */

const fs = require('fs');
const path = require('path');

// 模拟一个包含相互引用的控制器脚本
const testCode = `
/**
 * 测试用例：包含相互引用的控制器脚本
 */

// 依赖声明
const utils = require('./utils');
const { EventEmitter } = require('events');

// 控制器类之间相互引用
class UserController {
  constructor() {
    this.orderService = new OrderController();
    this.productService = new ProductController();
  }
  
  getUserOrders(userId) {
    const user = this.getUserById(userId);
    const orders = this.orderService.getOrdersByUser(userId);
    return { user, orders };
  }
  
  getUserById(id) {
    return { id, name: 'User ' + id };
  }
  
  // 引用另一个控制器的方法
  processOrder(orderId) {
    return this.orderService.processOrder(orderId);
  }
}

class OrderController {
  constructor() {
    this.productService = new ProductController();
  }
  
  getOrdersByUser(userId) {
    // 引用UserController的方法
    return [
      { id: 1, userId: userId, productId: 101, status: 'completed' },
      { id: 2, userId: userId, productId: 102, status: 'pending' }
    ];
  }
  
  processOrder(orderId) {
    const order = this.getOrderById(orderId);
    const product = this.productService.getProduct(order.productId);
    return { order, product };
  }
  
  getOrderById(id) {
    return { id, productId: 101, status: 'pending' };
  }
  
  // 引用ProductController的方法
  validateProduct(productId) {
    return this.productService.validateProduct(productId);
  }
}

class ProductController {
  getProduct(productId) {
    return { id: productId, name: 'Product ' + productId, price: 99.99 };
  }
  
  validateProduct(productId) {
    return productId > 0;
  }
  
  // 引用OrderController的方法来检查订单状态
  getProductOrders(productId) {
    // 这里应该调用OrderController的方法，但为了演示直接返回
    return [{ orderId: 1, userId: 1 }];
  }
}

// 立即执行函数中使用控制器
(function() {
  const userCtrl = new UserController();
  const orderCtrl = new OrderController();
  
  // 演示相互引用
  console.log('User controller initialized with order service:', userCtrl.orderService !== undefined);
  console.log('Order controller initialized with product service:', orderCtrl.productService !== undefined);
})();

// 导出所有控制器
module.exports = {
  UserController,
  OrderController, 
  ProductController
};
`;

// 创建测试文件
const testFile = path.join(__dirname, 'test-controller-interdependent.js');
fs.writeFileSync(testFile, testCode);

console.log('✅ 测试文件已创建:', testFile);
console.log('\n测试用例说明:');
console.log('- UserController 引用了 OrderController 和 ProductController');
console.log('- OrderController 引用了 ProductController 和 UserController 的方法');
console.log('- ProductController 引用了 OrderController 的方法');
console.log('- 这是一个典型的相互引用场景');

module.exports = { testFile, testCode };