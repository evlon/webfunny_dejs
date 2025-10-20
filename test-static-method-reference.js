/**
 * 测试子模块间静态方法引用功能
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('./split');

// 测试用例：包含静态方法引用的控制器脚本
const testCode = `
/**
 * 测试静态方法引用
 */

class Controller1 {
  static log() {
    console.log('Controller1 logging');
  }
}

class Controller2 {
  static log() {
    Controller1.log(); // 静态方法调用
  }
  
  instanceMethod() {
    console.log('Instance method');
  }
}

// 演示静态方法调用
Controller2.log();

module.exports = { Controller1, Controller2 };
`;

// 运行测试
async function runTest() {
  console.log('🧪 开始测试静态方法引用功能...\n');
  
  // 创建测试目录和文件
  const testDir = path.join(__dirname, 'test-static-method-result');
  const testFile = path.join(testDir, 'test-static-method.js');
  
  // 清理之前的测试结果
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFile, testCode);
  
  console.log('✅ 测试文件已创建:', testFile);
  
  try {
    // 运行拆分功能
    console.log('\n🔄 开始拆分控制器脚本（包含静态方法引用）...');
    const result = splitControllerScript(testFile, testDir, { backup: false });
    
    console.log('✅ 拆分完成！');
    
    // 验证生成的模块文件
    console.log('\n🔍 检查生成的模块文件...');
    
    const subModulesDir = path.join(testDir, 'sub-modules');
    const moduleFiles = fs.readdirSync(subModulesDir);
    
    console.log(`✅ 子模块文件列表:`);
    moduleFiles.forEach(file => {
      console.log(`   - ${file}`);
      
      // 检查文件内容
      const filePath = path.join(subModulesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (file === 'controller2.js') {
        console.log(`   - 检查 Controller2 的静态方法引用:`);
        console.log(`     ${content.includes('Controller1.log()') ? '✅' : '❌'} 包含 Controller1.log()`);
        console.log(`     ${content.includes('require(\'../sub-modules/controller1\')') ? '✅' : '❌'} 包含正确的 require 语句`);
        
        // 显示文件内容
        console.log('\n📄 controller2.js 内容:');
        console.log(content);
      }
    });
    
    console.log('\n🎉 静态方法引用功能测试完成！');
    
    // 保留测试文件用于检查
    console.log('\n📁 测试文件保留在:', testDir);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    
    // 保留测试文件用于调试
    console.log('\n⚠️  测试文件保留在:', testDir);
  }
}

// 运行测试
runTest().catch(console.error);