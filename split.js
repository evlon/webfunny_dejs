#!/usr/bin/env node

/**
 * 加密脚本拆分工具 - 完整执行环境版本
 * 确保每个拆分后的模块都能独立执行，包含完整的闭包环境
 */

const fs = require('fs');
const path = require('path');

// 复用 lib 目录中的AST工具
const { parseCode, traverse, generate } = require('./lib/ast-utils');

/**
 * 分析目标脚本的控制器类结构
 */
function analyzeControllerScript(targetFile) {
  console.log(`分析控制器脚本: ${targetFile}`);
  
  try {
    const code = fs.readFileSync(targetFile, 'utf8');
    const ast = parseCode(code);
    
    const controllers = new Map(); // 类名 -> 类信息
    const exports = new Map(); // 导出名 -> 类名
    const requiredModules = new Set(); // 依赖模块
    
    console.log('开始AST分析...');
    
    // 分析require语句
    traverse(ast, {
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
          if (path.node.arguments.length > 0 && path.node.arguments[0].type === 'StringLiteral') {
            requiredModules.add(path.node.arguments[0].value);
          }
        }
      }
    });
    
    // 收集所有类定义
    let classCount = 0;
    traverse(ast, {
      ClassDeclaration(path) {
        const className = path.node.id?.name;
        if (className) {
          classCount++;
          console.log(`找到类定义 [${classCount}]: ${className}`);
          
          controllers.set(className, {
            name: className,
            node: path.node,
            code: generate(path.node).code,
            startLine: path.node.loc?.start.line,
            endLine: path.node.loc?.end.line,
            isExported: false,
            exportName: className
          });
        }
      }
    });
    
    // 分析导出结构
    let exportFound = false;
    traverse(ast, {
      AssignmentExpression(path) {
        // 处理 module.exports = { ... }
        if (path.node.left.type === 'MemberExpression' &&
            path.node.left.object?.name === 'module' &&
            path.node.left.property?.name === 'exports') {
          
          exportFound = true;
          console.log('找到module.exports赋值语句');
          
          if (path.node.right.type === 'ObjectExpression') {
            console.log('找到ObjectExpression导出对象');
            
            path.node.right.properties.forEach((prop, index) => {
              console.log(`处理导出属性 [${index}]:`, prop.type);
              
              if (prop.type === 'ObjectProperty') {
                let keyName = '';
                let valueName = '';
                
                // 获取键名
                if (prop.key.type === 'Identifier') {
                  keyName = prop.key.name;
                }
                
                // 获取值名
                if (prop.value.type === 'Identifier') {
                  valueName = prop.value.name;
                }
                
                if (keyName && valueName) {
                  exports.set(keyName, valueName);
                  console.log(`导出映射: ${keyName} -> ${valueName}`);
                  
                  // 标记这个类被导出了
                  if (controllers.has(valueName)) {
                    controllers.get(valueName).isExported = true;
                    controllers.get(valueName).exportName = keyName;
                    console.log(`标记类 ${valueName} 为已导出，导出名: ${keyName}`);
                  }
                }
              }
            });
          }
        }
      }
    });
    
    if (!exportFound) {
      console.log('警告: 未找到module.exports语句');
    }
    
    console.log(`AST分析完成: 找到 ${controllers.size} 个类，${exports.size} 个导出项`);
    
    return {
      controllers,
      exports,
      requiredModules,
      ast,
      code
    };
    
  } catch (error) {
    console.error(`分析控制器脚本失败: ${error.message}`);
    throw error;
  }
}

/**
 * 生成控制器模块文件
 */
function generateControllerModule(controllerInfo, allRequiredModules) {
  const { name, code } = controllerInfo;
  
  let content = `/**
 * ${name} 控制器模块
 * 从加密脚本拆分出来的独立控制器类
 */

`;
  
  // 添加必要的require语句
  const dependenciesToAdd = new Set();
  
  // 检查代码中使用了哪些模块
  allRequiredModules.forEach(modulePath => {
    const moduleName = path.basename(modulePath, path.extname(modulePath));
    
    if (code.includes(`${moduleName}.`) || 
        (modulePath === 'moment' && code.includes('moment.')) ||
        (modulePath === 'fs' && code.includes('fs.')) ||
        (modulePath === 'node-fetch' && code.includes('fetch')) ||
        (modulePath === 'jsonwebtoken' && code.includes('jwt')) ||
        (modulePath === 'crypto' && code.includes('crypto.'))) {
      dependenciesToAdd.add(modulePath);
    }
  });
  
  // 添加require语句
  if (dependenciesToAdd.size > 0) {
    dependenciesToAdd.forEach(modulePath => {
      const moduleName = path.basename(modulePath, path.extname(modulePath));
      if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
        content += `const ${moduleName} = require('${modulePath}');\n`;
      } else {
        content += `const ${moduleName} = require('${modulePath}');\n`;
      }
    });
    content += '\n';
  }
  
  // 添加控制器类代码
  content += `${code}\n\n`;
  
  // 导出控制器类
  content += `module.exports = { ${name} };\n`;
  
  return content;
}

/**
 * 生成主入口文件
 */
function generateMainEntryFile(splitModules, originalFile) {
  let content = `/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: ${path.basename(originalFile)}
 * 拆分时间: ${new Date().toISOString()}
 * 控制器模块目录: controller-modules/
 */

`;
  
  // 添加所有控制器模块的require
  splitModules.forEach((moduleInfo, className) => {
    const modulePath = `./controller-modules/${moduleInfo.fileName.replace('.js', '')}`;
    content += `const ${moduleInfo.moduleName} = require('${modulePath}');\n`;
  });
  
  content += '\n';
  
  // 合并所有导出，保持原始导出结构
  content += `module.exports = {\n`;
  
  let exportCount = 0;
  splitModules.forEach((moduleInfo, className) => {
    if (moduleInfo.isExported) {
      content += `  ${moduleInfo.exportName}: ${moduleInfo.moduleName}.${className},\n`;
      exportCount++;
    }
  });
  
  content += `};\n`;
  
  console.log(`生成主入口文件: 包含 ${exportCount} 个导出项`);
  
  return content;
}

/**
 * 拆分控制器脚本
 */
function splitControllerScript(targetFile, outputDir, options = {}) {
  console.log(`开始拆分控制器脚本: ${targetFile}`);
  
  const { backup = true } = options;
  
  try {
    // 备份原始文件（只备份一次）
    if (backup) {
      const backupDir = path.dirname(targetFile);
      const fileName = path.basename(targetFile);
      const backupFile = path.join(backupDir, `${fileName}.split.bak`);
      
      // 如果备份文件不存在，才创建备份
      if (!fs.existsSync(backupFile)) {
        fs.copyFileSync(targetFile, backupFile);
        console.log(`✅ 创建原始文件备份: ${backupFile}`);
      } else {
        console.log(`ℹ️  备份文件已存在: ${backupFile}`);
      }
    }
    
    // 分析目标脚本
    const analysis = analyzeControllerScript(targetFile);
    const { controllers, exports } = analysis;
    
    if (controllers.size === 0) {
      throw new Error('未找到任何控制器类定义');
    }
    
    // 子模块目录路径
    const subModulesDir = path.join(outputDir, 'controller-modules');
    
    // 确保目录存在
    if (!fs.existsSync(subModulesDir)) {
      fs.mkdirSync(subModulesDir, { recursive: true });
    }
    
    console.log(`准备拆分 ${controllers.size} 个控制器到 controller-modules 目录`);
    
    // 生成控制器模块
    const splitModules = new Map();
    
    controllers.forEach((controllerInfo, className) => {
      const fileName = `${className.toLowerCase()}.js`;
      
      const content = generateControllerModule(controllerInfo, analysis.requiredModules);
      
      splitModules.set(className, {
        moduleName: className.toLowerCase(),
        fileName,
        content,
        exportName: controllerInfo.exportName,
        isExported: controllerInfo.isExported
      });
    });
    
    // 写入控制器模块文件
    splitModules.forEach((moduleInfo, className) => {
      const filePath = path.join(subModulesDir, moduleInfo.fileName);
      fs.writeFileSync(filePath, moduleInfo.content, 'utf8');
      console.log(`生成控制器模块: controller-modules/${moduleInfo.fileName} (${className})`);
    });
    
    // 生成主入口文件
    const mainEntryContent = generateMainEntryFile(splitModules, targetFile);
    const mainEntryPath = path.join(outputDir, path.basename(targetFile));
    fs.writeFileSync(mainEntryPath, mainEntryContent, 'utf8');
    console.log(`生成主入口文件: ${path.basename(targetFile)}`);
    
    console.log(`\n✅ 控制器拆分完成！`);
    console.log(`- 拆分了 ${splitModules.size} 个控制器到 controller-modules 目录`);
    console.log(`- 主入口文件: ${path.basename(targetFile)}（保持原文件名）`);
    console.log(`- 原有引用可以继续使用 require('./${path.basename(targetFile)}')`);
    
    return {
      splitModules: Array.from(splitModules.entries()).map(([className, info]) => ({
        className,
        moduleName: info.moduleName,
        fileName: info.fileName,
        exportName: info.exportName,
        isExported: info.isExported
      })),
      mainEntryFile: mainEntryPath,
      subModulesDir: subModulesDir
    };
    
  } catch (error) {
    console.error(`❌ 控制器拆分失败: ${error.message}`);
    throw error;
  }
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node controller-split-v2.js <目标加密脚本> [输出目录]');
    console.log('示例: node controller-split-v2.js 目标-加密-脚本.js');
    console.log('       node controller-split-v2.js 目标-加密-脚本.js ./controller-result');
    process.exit(1);
  }
  
  const targetFile = args[0];
  const outputDir = args[1] || path.dirname(targetFile);
  
  try {
    // 执行拆分
    const result = splitControllerScript(targetFile, outputDir);
    console.log('✅ 控制器拆分完成！');
    
  } catch (error) {
    console.error('拆分失败:', error.message);
    process.exit(1);
  }
}

module.exports = {
  splitControllerScript
};