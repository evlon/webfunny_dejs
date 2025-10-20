/**
 * UserController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

// 全局声明
// 情况4：函数依赖于全局变量
function createUserHash(name) {
  const hash = crypto.createHash('sha256');
  hash.update(name);
  return hash.digest('hex');
}

// 情况5：复杂的依赖链
const userConfig = Object.assign({}, defaultConfig, {
  salt: 'mysalt'
});

// 控制器类声明

// 情况1：全局变量依赖于另一个全局变量
const config = {
  debug: true,
  verbose: false
};

// 情况2：变量依赖于require的结果

// UserController 控制器类
// 控制器类声明
class UserController {
  constructor() {
    this.name = 'UserController';
  }
  createUser(username) {
    // 使用全局变量和require的变量
    const hash = createUserHash(username);
    if (config.debug) {
      console.log(`Creating user ${username} with hash ${hash}`);
    }
    return {
      username: username,
      hash: hash,
      config: userConfig
    };
  }
}

module.exports = { UserController };
