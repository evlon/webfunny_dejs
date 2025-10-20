/**
 * 控制器脚本拆分后的主入口文件
 * 原始文件: test-self-reference.js
 * 拆分时间: 2025-10-19T16:40:29.066Z
 * 控制器模块目录: sub-modules/
 */

const selfreferencingcontroller = require('./sub-modules/selfreferencingcontroller');
const externalreferencecontroller = require('./sub-modules/externalreferencecontroller');

module.exports = {
  SelfReferencingController: selfreferencingcontroller.SelfReferencingController,
  ExternalReferenceController: externalreferencecontroller.ExternalReferenceController,
};
