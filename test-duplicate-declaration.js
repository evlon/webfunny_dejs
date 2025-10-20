/**
 * 测试require变量和全局变量重名冲突问题
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('./split');

// 测试用例：包含require语句和全局变量重名的情况
const testCode = `
/**
 * 测试require变量和全局变量重名冲突
 */

// 模拟require语句导入的变量
const vRequire8 = require("../util/status-code");

// 一些模型导入（可能会被当作全局变量）
const { UserTokenModel, AlarmItemModel } = require('../../modules/models.js');
const vRequire9 = require('../../util/status-code'); // 使用不同的变量名避免语法错误

// 全局变量声明
const globalConfig = {
  appName: 'MyApp',
  version: '1.0.0'
};

// 全局函数
function helperFunction() {
  return 'helper result';
}

class ControllerWithRequire {
  constructor() {
    this.config = globalConfig;
  }
  
  static process() {
    // 使用全局变量和require导入的变量
    return helperFunction() + ' - ' + globalConfig.appName;
  }
  
  useRequire() {
    // 使用require导入的变量
    return vRequire8.someMethod();
  }
}

module.exports = { ControllerWithRequire };
`;

// 运行测试
async function runTest() {
  console.log('🧪 开始测试require变量和全局变量重名冲突...\n');
  
  // 创建测试目录和文件
  const testDir = path.join(__dirname, 'test-duplicate-result');
  const testFile = path.join(testDir, 'test-duplicate.js');
  
  // 清理之前的测试结果
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFile, testCode);
  
  console.log('✅ 测试文件已创建:', testFile);
  
  try {
    // 运行拆分功能
    console.log('\n🔄 开始拆分控制器脚本（包含重名冲突）...');
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
      
      if (file === 'controllerwithrequire.js') {
        console.log('\n📄 检查 ControllerWithRequire 的重名冲突处理:');
        
        // 检查是否有重复声明
        const vRequire8Count = (content.match(/const vRequire8/g) || []).length;
        console.log(`   ${vRequire8Count <= 1 ? '✅' : '❌'} vRequire8 声明次数: ${vRequire8Count} (应该 <= 1)`);
        
        // 检查是否有语法错误
        const hasSyntaxError = content.includes('const vRequire8 =') && content.includes('const vRequire8 = require');
        console.log(`   ${!hasSyntaxError ? '✅' : '❌'} 没有语法错误`);
        
        // 检查全局变量是否正确处理
        console.log(`   ${content.includes('const globalConfig') ? '✅' : '❌'} 包含 globalConfig`);
        console.log(`   ${content.includes('function helperFunction') ? '✅' : '❌'} 包含 helperFunction`);
        
        console.log('\n📄 controllerwithrequire.js 内容:');
        console.log(content);
        
        // 检查是否有重复声明错误
        if (vRequire8Count > 1) {
          console.log('\n❌ 发现重复声明问题！');
        }
      }
    });
    
    console.log('\n🎉 重名冲突测试完成！');
    
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