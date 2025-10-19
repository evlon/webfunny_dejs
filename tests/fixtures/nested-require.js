/**
 * 嵌套require测试文件
 */

// 情况1: 嵌套require - 变量引用
const vRequire41 = require("../config/consts");
const {
  PROJECT_API,
  LOCAL_SERVER,
  ALARM_INDEX_ENUM
} = vRequire41;

// 情况2: 多层嵌套
const baseConfig = require("./base");
const { database, redis } = baseConfig;
const { host, port } = database;

// 控制器类定义
class NestedController {
  constructor() {
    this.projectApi = PROJECT_API;
    this.localServer = LOCAL_SERVER;
    this.alarmIndex = ALARM_INDEX_ENUM;
    this.dbHost = host;
    this.dbPort = port;
  }
  
  method() {
    return {
      api: this.projectApi,
      server: this.localServer,
      alarm: this.alarmIndex
    };
  }
}

module.exports = { NestedController };