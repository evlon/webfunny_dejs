/**
 * split.js 功能单元测试
 * 测试require路径修正、解构赋值、嵌套require等功能
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('../../../split');

describe('split.js 功能测试', () => {
  const testOutputDir = path.join(__dirname, '../../test-output');
  
  beforeEach(() => {
    // 清理测试输出目录
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
    fs.mkdirSync(testOutputDir, { recursive: true });
  });
  
  afterEach(() => {
    // 清理测试输出目录
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
  });
  
  describe('基础路径修正功能', () => {
    test('应该正确处理简单相对路径', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/simple-controller.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      // 验证结果
      expect(result).toBeDefined();
      expect(result.splitModules).toHaveLength(1);
      expect(result.splitModules[0].className).toBe('SimpleController');
      
      // 验证生成的子模块文件
      const modulePath = path.join(testOutputDir, 'sub-modules/simplecontroller.js');
      expect(fs.existsSync(modulePath)).toBe(true);
      
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // 验证路径修正
      expect(moduleContent).toContain("require('../config')");
      expect(moduleContent).toContain("require('../../utils')");
      expect(moduleContent).toContain("require('../../../../sso')");
    });
  });
  
  describe('解构赋值处理', () => {
    test('应该正确处理解构赋值require', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/destructured-require.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      expect(result).toBeDefined();
      expect(result.splitModules).toHaveLength(1);
      
      const modulePath = path.join(testOutputDir, 'sub-modules/destructuredcontroller.js');
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // 验证解构赋值保持正确结构
      expect(moduleContent).toContain("const { feiShuConfig, idsConfig } = require('../../../../sso')");
      expect(moduleContent).toContain("const { readFile, writeFile } = require('fs')");
      expect(moduleContent).toContain("const { Component, useState, useEffect } = require('react')");
      
      // 验证变量使用
      expect(moduleContent).toContain('this.feishu = feiShuConfig');
      expect(moduleContent).toContain('readFile(\'./test.txt\')');
    });
  });
  
  describe('嵌套require处理', () => {
    test('应该正确处理嵌套require和变量引用', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/nested-require.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      expect(result).toBeDefined();
      expect(result.splitModules).toHaveLength(1);
      
      const modulePath = path.join(testOutputDir, 'sub-modules/nestedcontroller.js');
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // 验证嵌套require处理
      expect(moduleContent).toContain("const vRequire41 = require('../../config/consts')");
      expect(moduleContent).toContain("const { PROJECT_API, LOCAL_SERVER, ALARM_INDEX_ENUM } = vRequire41");
      
      // 验证变量使用
      expect(moduleContent).toContain('this.projectApi = PROJECT_API');
      expect(moduleContent).toContain('this.localServer = LOCAL_SERVER');
      
      // 验证依赖顺序（vRequire41在使用前定义）
      const vRequireIndex = moduleContent.indexOf('const vRequire41');
      const projectApiIndex = moduleContent.indexOf('PROJECT_API');
      expect(vRequireIndex).toBeLessThan(projectApiIndex);
    });
  });
  
  describe('混合模式处理', () => {
    test('应该正确处理混合require模式', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/mixed-require.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      expect(result).toBeDefined();
      expect(result.splitModules).toHaveLength(1);
      
      const modulePath = path.join(testOutputDir, 'sub-modules/mixedcontroller.js');
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // 验证各种require模式
      expect(moduleContent).toContain("require('../config')");
      expect(moduleContent).toContain("const { logger, utils } = require('../../lib')");
      expect(moduleContent).toContain("const baseModule = require('../../../base')");
      expect(moduleContent).toContain("const { settings, options } = baseModule");
      expect(moduleContent).toContain("require('express')");
      expect(moduleContent).toContain("const { Router } = require('express')");
      
      // 验证变量使用
      expect(moduleContent).toContain('this.config = config');
      expect(moduleContent).toContain('this.logger = logger');
      expect(moduleContent).toContain('this.Router = Router');
    });
  });
  
  describe('依赖顺序验证', () => {
    test('应该确保变量在使用前定义', async () => {
      const fixturePath = path.join(__dirname, '../../fixtures/nested-require.js');
      const result = await splitControllerScript(fixturePath, testOutputDir, { backup: false });
      
      const modulePath = path.join(testOutputDir, 'sub-modules/nestedcontroller.js');
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // 验证依赖顺序
      const lines = moduleContent.split('\n');
      const vRequireLine = lines.findIndex(line => line.includes('const vRequire41'));
      const projectApiLine = lines.findIndex(line => line.includes('PROJECT_API'));
      
      expect(vRequireLine).toBeGreaterThan(-1);
      expect(projectApiLine).toBeGreaterThan(-1);
      expect(vRequireLine).toBeLessThan(projectApiLine);
    });
  });
  
});