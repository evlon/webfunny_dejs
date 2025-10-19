/**
 * 测试脚本 - 包含各种require路径模式
 * 用于测试split.js的路径修正功能
 */

const fs = require('fs');
const path = require('path');

// 情况1: 简单相对路径
const config = require("./config");

// 情况2: 上级目录相对路径
const utils = require("../utils");

// 情况3: 多级上级目录
const ssoConfig = require("../../../sso");

// 情况4: 解构赋值相对路径
const {
  feiShuConfig,
  idsConfig
} = require("../../../sso");

// 情况5: 嵌套require - 这是当前无法处理的情况
const vRequire41 = require("../config/consts");
const {
  PROJECT_API,
  LOCAL_SERVER,
  ALARM_INDEX_ENUM
} = vRequire41;

// 情况6: node_modules路径（应该保持不变）
const express = require('express');
const axios = require('axios');

// 情况7: 解构赋值node_modules
const { readFile, writeFile } = require('fs');

// 情况8: 复杂的解构赋值
const {
  Component,
  useState,
  useEffect
} = require('react');

// 控制器类定义
class TestController1 {
  constructor() {
    this.config = config;
    this.utils = utils;
    this.sso = ssoConfig;
    this.feishu = feiShuConfig;
  }
  
  method1() {
    return this.config.someValue;
  }
}

class TestController2 {
  constructor() {
    this.projectApi = PROJECT_API;
    this.localServer = LOCAL_SERVER;
    this.express = express;
  }
  
  method2() {
    return this.projectApi.endpoint;
  }
}

class TestController3 {
  method3() {
    // 使用node_modules中的模块
    const app = express();
    const file = readFile('./test.txt');
    return { app, file };
  }
}

class TestController4 {
  method4() {
    // 使用React相关变量
    const [state, setState] = useState();
    useEffect(() => {}, []);
    return new Component();
  }
}

// 导出控制器
module.exports = {
  TestController1,
  TestController2, 
  TestController3,
  TestController4
};