/**
 * AuthController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

const crypto = require('crypto');

// 情况1：全局变量依赖于另一个全局变量
const config = {
  debug: true,
  verbose: false
};

// 情况2：变量依赖于require的结果
// 情况5：复杂的依赖链
const defaultConfig = {
  algorithm: 'sha256',
  encoding: 'hex'
};
const userConfig = Object.assign({}, defaultConfig, {
  salt: 'mysalt'
});

// 控制器类声明
const UserController = require('../sub-modules/usercontroller').UserController;

// AuthController 控制器类
class AuthController {
  constructor() {
    this.name = 'AuthController';
    this.userController = new UserController();
  }
  authenticate(userData) {
    // 使用全局依赖
    const isValid = this.validateHash(userData);
    if (isValid && config.debug) {
      console.log('Authentication successful');
    }
    return isValid;
  }
  validateHash(userData) {
    // 使用crypto模块
    const hash = crypto.createHash(userConfig.algorithm);
    hash.update(userData.username);
    return hash.digest(userConfig.encoding) === userData.hash;
  }
}

// 导出控制器

module.exports = { AuthController };
