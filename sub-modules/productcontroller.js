/**
 * ProductController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

const UserController = require('../sub-modules/usercontroller').UserController;

// ProductController 控制器类
class ProductController {
  constructor() {
    this.name = 'ProductController';
    // 引用其他控制器
    this.userController = new UserController();
  }
}

// 导出控制器

module.exports = { ProductController };
