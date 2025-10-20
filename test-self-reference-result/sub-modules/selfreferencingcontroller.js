/**
 * SelfReferencingController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */


// SelfReferencingController 控制器类
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

module.exports = { SelfReferencingController };
