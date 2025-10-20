/**
 * ExternalReferenceController 控制器模块 - 支持子模块间引用版本
 * 包含该控制器相关的代码、依赖和子模块引用
 */

const SelfReferencingController = require('../sub-modules/selfreferencingcontroller').SelfReferencingController;

// ExternalReferenceController 控制器类
class ExternalReferenceController {
  static callExternal() {
    // 外部引用：应该生成require语句
    SelfReferencingController.staticMethod1();
  }
}

module.exports = { ExternalReferenceController };
