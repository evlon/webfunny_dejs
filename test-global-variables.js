/**
 * 测试子模块中全局变量的正确处理
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('./split');

// 测试用例：包含全局变量的控制器脚本
const testCode = `
/**
 * 测试全局变量处理
 */

// 全局变量声明
const globalConfig = {
  appName: 'MyApp',
  version: '1.0.0'
};

// 全局函数
function helperFunction() {
  return 'helper result';
}

class ControllerWithGlobals {
  constructor() {
    this.config = globalConfig; // 使用全局变量
  }
  
  static getInfo() {
    return helperFunction() + ' - ' + globalConfig.appName; // 使用全局变量和函数
  }
  
  instanceMethod() {
    // 使用全局变量
    console.log('App:', globalConfig.appName, 'Version:', globalConfig.version);
  }
}

// 另一个全局变量
const anotherGlobal = 'test value';

class AnotherController {
  static process() {
    return helperFunction() + ' - ' + anotherGlobal; // 使用全局变量和函数
  }
}

module.exports = { ControllerWithGlobals, AnotherController };
`;

// 运行测试
async function runTest() {
  console.log('🧪 开始测试全局变量处理功能...\n');
  
  // 创建测试目录和文件
  const testDir = path.join(__dirname, 'test-global-variables-result');
  const testFile = path.join(testDir, 'test-global-variables.js');
  
  // 清理之前的测试结果
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFile, testCode);
  
  console.log('✅ 测试文件已创建:', testFile);
  
  try {
    // 运行拆分功能
    console.log('\n🔄 开始拆分控制器脚本（包含全局变量）...');
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
      
      if (file === 'controllerwithglobals.js') {
        console.log('\n📄 检查 ControllerWithGlobals 的全局变量处理:');
        console.log(`   ${content.includes('globalConfig') ? '✅' : '❌'} 包含 globalConfig`);
        console.log(`   ${content.includes('helperFunction') ? '✅' : '❌'} 包含 helperFunction`);
        console.log(`   ${content.includes('const globalConfig') ? '✅' : '❌'} 包含全局变量声明`);
        console.log(`   ${content.includes('function helperFunction') ? '✅' : '❌'} 包含全局函数声明`);
        
        // 检查全局变量是否在类定义之前
        const classIndex = content.indexOf('class ControllerWithGlobals');
        const globalConfigIndex = content.indexOf('const globalConfig');
        const helperFunctionIndex = content.indexOf('function helperFunction');
        
        console.log(`   ${globalConfigIndex < classIndex ? '✅' : '❌'} 全局变量在类定义之前`);
        console.log(`   ${helperFunctionIndex < classIndex ? '✅' : '❌'} 全局函数在类定义之前`);
        
        console.log('\n📄 controllerwithglobals.js 内容:');
        console.log(content);
      }
      
      if (file === 'anothercontroller.js') {
        console.log('\n📄 检查 AnotherController 的全局变量处理:');
        console.log(`   ${content.includes('anotherGlobal') ? '✅' : '❌'} 包含 anotherGlobal`);
        console.log(`   ${content.includes('helperFunction') ? '✅' : '❌'} 包含 helperFunction`);
        console.log(`   ${content.includes('const anotherGlobal') ? '✅' : '❌'} 包含全局变量声明`);
        
        console.log('\n📄 anothercontroller.js 内容:');
        console.log(content);
      }
    });
    
    console.log('\n🎉 全局变量处理功能测试完成！');
    
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