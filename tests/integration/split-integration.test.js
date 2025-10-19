/**
 * split.js 集成测试
 * 测试完整的拆分流程和输出验证
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('../../split');

describe('split.js 集成测试', () => {
  const testOutputDir = path.join(__dirname, '../../test-output');
  
  beforeEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
    fs.mkdirSync(testOutputDir, { recursive: true });
  });
  
  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });
  
  describe('完整拆分流程', () => {
    test('应该生成完整的文件结构', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/mixed-require.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      // 验证结果结构
      expect(result).toBeDefined();
      expect(result.splitModules).toHaveLength(1);
      expect(result.mainEntryFile).toBeDefined();
      expect(result.subModulesDir).toBeDefined();
      
      // 验证文件结构
      expect(fs.existsSync(result.mainEntryFile)).toBe(true);
      expect(fs.existsSync(result.subModulesDir)).toBe(true);
      
      // 验证子模块文件
      const moduleFiles = fs.readdirSync(result.subModulesDir);
      expect(moduleFiles).toHaveLength(1);
      expect(moduleFiles[0]).toBe('mixedcontroller.js');
      
      // 验证主入口文件
      const mainContent = fs.readFileSync(result.mainEntryFile, 'utf8');
      expect(mainContent).toContain('require(\'./sub-modules/mixedcontroller\')');
      expect(mainContent).toContain('module.exports');
    });
    
    test('应该保持原始导出结构', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/simple-controller.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      const mainContent = fs.readFileSync(result.mainEntryFile, 'utf8');
      
      // 验证导出结构
      expect(mainContent).toContain('SimpleController: simplecontroller.SimpleController');
    });
  });
  
  describe('复杂依赖处理', () => {
    test('应该处理包含多个控制器的文件', async () => {
      const multiControllerCode = `
        const fs = require('fs');
        const config = require('./config');
        
        class Controller1 {
          method1() {
            return fs.readFileSync('./test.txt');
          }
        }
        
        class Controller2 {
          method2() {
            return config.getValue();
          }
        }
        
        class Controller3 {
          method3() {
            const c1 = new Controller1();
            const c2 = new Controller2();
            return { c1, c2 };
          }
        }
        
        module.exports = {
          Ctrl1: Controller1,
          Ctrl2: Controller2,
          Ctrl3: Controller3
        };
      `;
      
      const tempFile = path.join(testOutputDir, 'multi-controller.js');
      fs.writeFileSync(tempFile, multiControllerCode);
      
      const result = await splitControllerScript(tempFile, testOutputDir, { backup: false });
      
      expect(result.splitModules).toHaveLength(3);
      
      // 验证每个控制器都生成了模块
      const moduleFiles = fs.readdirSync(result.subModulesDir);
      expect(moduleFiles).toContain('controller1.js');
      expect(moduleFiles).toContain('controller2.js');
      expect(moduleFiles).toContain('controller3.js');
      
      // 验证主入口文件包含所有导出
      const mainContent = fs.readFileSync(result.mainEntryFile, 'utf8');
      expect(mainContent).toContain('Ctrl1: controller1.Controller1');
      expect(mainContent).toContain('Ctrl2: controller2.Controller2');
      expect(mainContent).toContain('Ctrl3: controller3.Controller3');
    });
  });
  
  describe('路径修正集成', () => {
    test('应该在不同目录结构中正确修正路径', async () => {
      const deepPathCode = `
        const config = require('./config');
        const utils = require('../utils');
        const lib = require('../../lib');
        const core = require('../../../core');
        
        class PathController {
          constructor() {
            this.config = config;
            this.utils = utils;
            this.lib = lib;
            this.core = core;
          }
        }
        
        module.exports = { PathController };
      `;
      
      const tempFile = path.join(testOutputDir, 'deep-path-controller.js');
      fs.writeFileSync(tempFile, deepPathCode);
      
      const result = await splitControllerScript(tempFile, testOutputDir, { backup: false });
      
      const modulePath = path.join(testOutputDir, 'sub-modules/pathcontroller.js');
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // 验证路径修正
      expect(moduleContent).toContain("require('../config')");
      expect(moduleContent).toContain("require('../../utils')");
      expect(moduleContent).toContain("require('../../../lib')");
      expect(moduleContent).toContain("require('../../../../core')");
    });
  });
  
  describe('备份功能', () => {
    test('应该创建备份文件', async () => {
      const fixturePath = path.join(__dirname, '../fixtures/simple-controller.js');
      
      // 先删除可能存在的备份文件
      const backupFile = fixturePath + '.split.bak';
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
      }
      
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: true });
      
      // 验证备份文件存在
      expect(fs.existsSync(backupFile)).toBe(true);
      
      // 验证备份文件内容
      const backupContent = fs.readFileSync(backupFile, 'utf8');
      const originalContent = fs.readFileSync(fixturePath, 'utf8');
      expect(backupContent).toBe(originalContent);
      
      // 清理备份文件
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
      }
    });
  });
});