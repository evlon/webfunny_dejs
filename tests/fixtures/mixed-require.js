/**
 * 混合require模式测试文件
 */

// 情况1: 简单相对路径
const config = require("./config");

// 情况2: 解构赋值
const { logger, utils } = require('../lib');

// 情况3: 嵌套require
const baseModule = require('../../base');
const { settings, options } = baseModule;

// 情况4: node_modules
const express = require('express');
const { Router } = require('express');

// 控制器类定义
class MixedController {
  constructor() {
    this.config = config;
    this.logger = logger;
    this.utils = utils;
    this.settings = settings;
    this.options = options;
    this.express = express;
    this.Router = Router;
  }
  
  method1() {
    return this.config.value;
  }
  
  method2() {
    this.logger.info('test');
    return this.utils.process();
  }
  
  method3() {
    const app = express();
    const router = Router();
    return { app, router };
  }
}

module.exports = { MixedController };