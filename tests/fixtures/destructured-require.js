/**
 * 解构赋值require测试文件
 */

// 情况1: 解构赋值相对路径
const {
  feiShuConfig,
  idsConfig
} = require("../../../sso");

// 情况2: 解构赋值node_modules
const { readFile, writeFile } = require('fs');

// 情况3: 复杂的解构赋值
const {
  Component,
  useState,
  useEffect
} = require('react');

// 控制器类定义
class DestructuredController {
  constructor() {
    this.feishu = feiShuConfig;
    this.ids = idsConfig;
  }
  
  method1() {
    const file = readFile('./test.txt');
    return file;
  }
  
  method2() {
    const [state] = useState();
    useEffect(() => {}, []);
    return new Component();
  }
}

module.exports = { DestructuredController };