/**
 * 简单控制器测试文件 - 包含基础require模式
 */

// 情况1: 简单相对路径
const config = require("./config");

// 情况2: 上级目录相对路径
const utils = require("../utils");

// 情况3: 多级上级目录
const ssoConfig = require("../../../sso");

// 控制器类定义
class SimpleController {
  constructor() {
    this.config = config;
    this.utils = utils;
    this.sso = ssoConfig;
  }
  
  method() {
    return this.config.value;
  }
}

module.exports = { SimpleController };