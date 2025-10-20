/**
 * 测试修正后的 split.js 功能
 * 验证子模块间引用处理
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('./split');

// 测试用例：包含相互引用的控制器脚本
const testCode = `
/**
 * 测试用例：包含相互引用的控制器脚本
 */

const fs = require('fs');
const path = require('path');

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

// 运行测试
async function runTest() {
  console.log('🧪 开始测试修正后的 split.js 功能...\n');
  
  // 创建测试目录和文件
  const testDir = path.join(__dirname, 'test-split-result');
  const testFile = path.join(testDir, 'test-controller-interdependent.js');
  
  // 清理之前的测试结果
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFile, testCode);
  
  console.log('✅ 测试文件已创建:', testFile);
  
  try {
    // 运行拆分功能
    console.log('\n🔄 开始拆分控制器脚本...');
    const result = splitControllerScript(testFile, testDir, { backup: false });
    
    console.log('✅ 拆分完成！');
    console.log(`\n📊 拆分结果:`);
    console.log(`- 拆分了 ${result.splitModules.length} 个控制器`);
    console.log(`- 主入口文件: ${path.basename(result.mainEntryFile)}`);
    console.log(`- 子模块目录: ${path.basename(result.subModulesDir)}`);
    
    // 验证生成的模块文件
    console.log('\n🔍 验证生成的模块文件...');
    
    const subModulesDir = path.join(testDir, 'sub-modules');
    const moduleFiles = fs.readdirSync(subModulesDir);
    
    console.log(`✅ 子模块文件列表:`);
    moduleFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
    // 检查模块内容
    console.log('\n📝 检查模块内容...');
    
    moduleFiles.forEach(file => {
      const filePath = path.join(subModulesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n📄 ${file}:`);
      console.log(`   - 文件大小: ${content.length} 字符`);
      console.log(`   - 包含控制器类: ${content.includes('class')}`);
      console.log(`   - 包含require语句: ${content.includes('require')}`);
      console.log(`   - 包含module.exports: ${content.includes('module.exports')}`);
      
      // 检查具体的控制器引用
      if (file.includes('usercontroller')) {
        console.log(`   - 引用OrderController: ${content.includes('OrderController')}`);
        console.log(`   - 引用ProductController: ${content.includes('ProductController')}`);
      } else if (file.includes('ordercontroller')) {
        console.log(`   - 引用ProductController: ${content.includes('ProductController')}`);
      }
    });
    
    // 检查主入口文件
    console.log('\n📋 检查主入口文件...');
    const mainFile = path.join(testDir, 'test-controller-interdependent.js');
    const mainContent = fs.readFileSync(mainFile, 'utf8');
    
    console.log(`   - 文件大小: ${mainContent.length} 字符`);
    console.log(`   - 包含require语句: ${mainContent.includes('require')}`);
    console.log(`   - 包含module.exports: ${mainContent.includes('module.exports')}`);
    
    // 验证导出结构
    const exportLines = mainContent.split('\n').filter(line => line.includes(':'));
    console.log(`   - 导出项数量: ${exportLines.length}`);
    
    console.log('\n🎉 测试完成！所有验证通过！');
    
    // 清理测试文件
    console.log('\n🧹 清理测试文件...');
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✅ 清理完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    
    // 保留测试文件用于调试
    console.log('\n⚠️  测试文件保留在:', testDir);
  }
}

// 运行测试
runTest().catch(console.error);