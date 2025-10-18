/**
 * AST工具函数模块
 * 包含所有与AST解析和操作相关的工具函数
 */

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

/**
 * 从AST节点提取函数名
 */
function extractFunctionName(callee) {
  if (callee.type === 'Identifier') {
    // 直接标识符调用: f123(...)
    return callee.name;
  } else if (callee.type === 'MemberExpression') {
    // 成员表达式调用: obj.f123(...) 或 this.f123(...)
    if (callee.property.type === 'Identifier') {
      const propertyName = callee.property.name;
      
      // 检查是否是 JavaScript 保留关键字
      const reservedKeywords = ['default', 'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'this', 'typeof', 'instanceof', 'new', 'delete', 'void', 'in', 'try', 'catch', 'finally', 'throw', 'class', 'extends', 'super', 'import', 'export', 'null', 'true', 'false', 'undefined', 'NaN', 'Infinity'];
      
      if (reservedKeywords.includes(propertyName)) {
        // 对于保留关键字，返回 null 表示不处理这种调用
        return null;
      }
      
      return propertyName;
    }
  }
  return null;
}

/**
 * 提取参数中的常量值
 */
function extractConstantArguments(args) {
  return args.map(arg => {
    if (arg.type === 'StringLiteral') return arg.value;
    if (arg.type === 'NumericLiteral') return arg.value;
    if (arg.type === 'BooleanLiteral') return arg.value;
    if (arg.type === 'NullLiteral') return null;
    if (arg.type === 'Identifier' && arg.name === 'undefined') return undefined;
    if (arg.type === 'UnaryExpression' && arg.operator === '-') {
      // 处理负号表达式：-123
      if (arg.argument.type === 'NumericLiteral') {
        return -arg.argument.value;
      }
    }
    return undefined; // 非常量参数
  });
}

/**
 * 检查是否是初始化函数调用（应该跳过）
 */
function isInitializationFunction(path) {
  // 检查是否是立即执行函数表达式（IIFE）
  if (path.parentPath && 
      path.parentPath.node.type === 'CallExpression' && 
      path.parentPath.node.callee.type === 'FunctionExpression') {
    return true;
  }
  
  // 检查父级上下文：如果在立即执行函数内部
  let parent = path.parentPath;
  while (parent) {
    if (parent.node.type === 'CallExpression' && 
        parent.node.callee.type === 'FunctionExpression') {
      return true;
    }
    parent = parent.parentPath;
  }
  
  // 检查是否在do-while循环中（典型的初始化模式）
  if (path.findParent(p => p.isDoWhileStatement())) {
    return true;
  }
  
  // 检查是否在try-catch块中（常见的初始化错误处理）
  if (path.findParent(p => p.isTryStatement())) {
    return true;
  }
  
  return false;
}

/**
 * 解析代码为AST
 */
function parseCode(code) {
  return parser.parse(code, {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true
  });
}

module.exports = {
  extractFunctionName,
  extractConstantArguments,
  isInitializationFunction,
  parseCode,
  traverse,
  generate,
  t
};