/**
 * 依赖分析功能单元测试
 * 测试extractGlobalDependencies和AST分析功能
 */

const fs = require('fs');
const path = require('path');
const { extractGlobalDependencies, analyzeControllerScript } = require('../../../split');

describe('依赖分析功能测试', () => {
  describe('extractGlobalDependencies', () => {
    test('应该提取简单require语句', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
        const config = require('./config');
      `;
      
      const dependencies = extractGlobalDependencies(code, '/test/file.js');
      
      expect(dependencies.size).toBe(3);
      expect(dependencies.has('fs')).toBe(true);
      expect(dependencies.has('path')).toBe(true);
      expect(dependencies.has('config')).toBe(true);
      
      const fsDep = dependencies.get('fs');
      expect(fsDep.type).toBe('require');
      expect(fsDep.code).toContain("const fs = require('fs')");
    });
    
    test('应该修正相对路径', () => {
      const code = `
        const config = require('./config');
        const utils = require('../utils');
        const sso = require('../../../sso');
      `;
      
      const dependencies = extractGlobalDependencies(code, '/test/file.js');
      
      const configDep = dependencies.get('config');
      expect(configDep.requirePath).toBe('../config');
      
      const utilsDep = dependencies.get('utils');
      expect(utilsDep.requirePath).toBe('../../utils');
      
      const ssoDep = dependencies.get('sso');
      expect(ssoDep.requirePath).toBe('../../../../sso');
    });
    
    test('应该处理解构赋值require', () => {
      const code = `
        const { readFile, writeFile } = require('fs');
        const { Component, useState } = require('react');
      `;
      
      const dependencies = extractGlobalDependencies(code, '/test/file.js');
      
      // 应该为解构赋值创建特殊的依赖项
      expect(dependencies.has('readFile')).toBe(true);
      expect(dependencies.has('writeFile')).toBe(true);
      expect(dependencies.has('Component')).toBe(true);
      expect(dependencies.has('useState')).toBe(true);
      
      const readFileDep = dependencies.get('readFile');
      expect(readFileDep.type).toBe('variable_from_destructured');
      
      // 应该存在解构赋值的依赖项
      const destructuredDep = dependencies.get('destructured_readFile_writeFile');
      expect(destructuredDep).toBeDefined();
      expect(destructuredDep.type).toBe('require_destructured');
      expect(destructuredDep.code).toContain("const { readFile, writeFile } = require('fs')");
    });
    
    test('应该处理嵌套require', () => {
      const code = `
        const baseConfig = require('./base');
        const { database, redis } = baseConfig;
        const { host, port } = database;
      `;
      
      const dependencies = extractGlobalDependencies(code, '/test/file.js');
      
      // 应该检测到间接解构赋值
      expect(dependencies.has('database')).toBe(true);
      expect(dependencies.has('redis')).toBe(true);
      expect(dependencies.has('host')).toBe(true);
      expect(dependencies.has('port')).toBe(true);
      
      const databaseDep = dependencies.get('database');
      expect(databaseDep.type).toBe('variable_from_indirect_destructured');
      
      const hostDep = dependencies.get('host');
      expect(hostDep.type).toBe('variable_from_indirect_destructured');
    });
  });
  
  describe('analyzeControllerScript', () => {
    test('应该分析控制器类结构', () => {
      const fixturePath = path.join(__dirname, '../../fixtures/simple-controller.js');
      const code = fs.readFileSync(fixturePath, 'utf8');
      
      const analysis = analyzeControllerScript(fixturePath);
      
      expect(analysis.controllers.size).toBe(1);
      expect(analysis.controllers.has('SimpleController')).toBe(true);
      
      const controller = analysis.controllers.get('SimpleController');
      expect(controller.name).toBe('SimpleController');
      expect(controller.isExported).toBe(true);
      expect(controller.exportName).toBe('SimpleController');
    });
    
    test('应该检测导出结构', () => {
      const code = `
        class Controller1 {}
        class Controller2 {}
        
        module.exports = {
          Ctrl1: Controller1,
          Ctrl2: Controller2
        };
      `;
      
      // 创建一个临时文件用于测试
      const tempFile = path.join(__dirname, '../../fixtures/temp-controller.js');
      fs.writeFileSync(tempFile, code);
      
      try {
        const analysis = analyzeControllerScript(tempFile);
        
        expect(analysis.controllers.size).toBe(2);
        expect(analysis.exports.size).toBe(2);
        
        const controller1 = analysis.controllers.get('Controller1');
        expect(controller1.isExported).toBe(true);
        expect(controller1.exportName).toBe('Ctrl1');
        
        const controller2 = analysis.controllers.get('Controller2');
        expect(controller2.isExported).toBe(true);
        expect(controller2.exportName).toBe('Ctrl2');
        
      } finally {
        // 清理临时文件
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
    
    test('应该收集require依赖', () => {
      const code = `
        const fs = require('fs');
        const config = require('./config');
        
        class TestController {
          constructor() {
            this.fs = fs;
            this.config = config;
          }
        }
        
        module.exports = { TestController };
      `;
      
      const tempFile = path.join(__dirname, '../../fixtures/temp-controller.js');
      fs.writeFileSync(tempFile, code);
      
      try {
        const analysis = analyzeControllerScript(tempFile);
        
        expect(analysis.requiredModules.size).toBe(2);
        expect(analysis.requiredModules.has('fs')).toBe(true);
        expect(analysis.requiredModules.has('./config')).toBe(true);
        
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });
});