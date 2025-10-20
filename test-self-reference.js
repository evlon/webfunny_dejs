/**
 * 测试类自引用（防止冗余require语句）
 */

const fs = require('fs');
const path = require('path');
const { splitControllerScript } = require('./split');

// 测试用例：包含类自引用的控制器脚本
const testCode = `
/**
 * 测试类自引用
 */

class SelfReferencingController {
  static staticMethod1() {
    console.log('Static method 1');
    // 自引用：调用自己的另一个静态方法
    SelfReferencingController.staticMethod2();
  }
  
  static staticMethod2() {
    console.log('Static method 2');
  }
  
  instanceMethod() {
    // 实例方法中调用静态方法
    SelfReferencingController.staticMethod1();
  }
  
  methodWithNew() {
    // 使用new创建自身实例（应该不生成require）
    const instance = new SelfReferencingController();
    return instance;
  }
}

class ExternalReferenceController {
  static callExternal() {
    // 外部引用：应该生成require语句
    SelfReferencingController.staticMethod1();
  }
}

module.exports = { SelfReferencingController, ExternalReferenceController };
`;

// 运行测试
async function runTest() {
  console.log('🧪 开始测试类自引用功能...\n');
  
  // 创建测试目录和文件
  const testDir = path.join(__dirname, 'test-self-reference-result');
  const testFile = path.join(testDir, 'test-self-reference.js');
  
  // 清理之前的测试结果
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(testFile, testCode);
  
  console.log('✅ 测试文件已创建:', testFile);
  
  try {
    // 运行拆分功能
    console.log('\n🔄 开始拆分控制器脚本（包含类自引用）...');
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
      
      if (file === 'selfreferencingcontroller.js') {
        console.log('\n📄 检查 SelfReferencingController 的类自引用:');
        console.log(`   ${content.includes('SelfReferencingController.staticMethod2()') ? '✅' : '❌'} 包含 SelfReferencingController.staticMethod2()`);
        console.log(`   ${content.includes('SelfReferencingController.staticMethod1()') ? '✅' : '❌'} 包含 SelfReferencingController.staticMethod1()`);
        console.log(`   ${content.includes('new SelfReferencingController()') ? '✅' : '❌'} 包含 new SelfReferencingController()`);
        
        // 关键检查：不应该有冗余的require语句
        const hasSelfRequire = content.includes('require(\'../sub-modules/selfreferencingcontroller\')');
        console.log(`   ${!hasSelfRequire ? '✅' : '❌'} 没有冗余的 SelfReferencingController 自引用 require 语句`);
        
        if (hasSelfRequire) {
          console.log('   ❌ 发现冗余的自引用require语句！');
        }
        
        console.log('\n📄 selfreferencingcontroller.js 内容:');
        console.log(content);
      }
      
      if (file === 'externalreferencecontroller.js') {
        console.log('\n📄 检查 ExternalReferenceController 的外部引用:');
        console.log(`   ${content.includes('SelfReferencingController.staticMethod1()') ? '✅' : '❌'} 包含 SelfReferencingController.staticMethod1()`);
        console.log(`   ${content.includes('require(\'../sub-modules/selfreferencingcontroller\')') ? '✅' : '❌'} 包含正确的 require 语句`);
        
        console.log('\n📄 externalreferencecontroller.js 内容:');
        console.log(content);
      }
    });
    
    console.log('\n🎉 类自引用功能测试完成！');
    
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