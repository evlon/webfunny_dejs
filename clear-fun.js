#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const { transformFromAstSync } = require('@babel/core');
const vm = require('vm');

// 检查参数是否是静态的（常量或固定对象属性）
function isStaticArgument(node) {
  if (!node) return false;
  // 原子字面量
  if (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral' ||
    node.type === 'NullLiteral' ||
    node.type === 'BigIntLiteral' ||
    node.type === 'RegExpLiteral'
  ) {
    return true;
  }
  // 纯模板字符串（无插值）
  if (node.type === 'TemplateLiteral') {
    return node.expressions && node.expressions.length === 0;
  }
  // 一元表达式 -arg / +arg 等（arg 静态）
  if (node.type === 'UnaryExpression') {
    return isStaticArgument(node.argument);
  }
  // 二元表达式（左右皆静态）
  if (node.type === 'BinaryExpression') {
    return isStaticArgument(node.left) && isStaticArgument(node.right);
  }
  // 条件表达式（各分支静态）
  if (node.type === 'ConditionalExpression') {
    return (
      isStaticArgument(node.test) &&
      isStaticArgument(node.consequent) &&
      isStaticArgument(node.alternate)
    );
  }
  // 成员访问：obj.prop 或 obj[staticKey]
  if (node.type === 'MemberExpression') {
    if (node.computed && !isStaticArgument(node.property)) return false;
    return isStaticArgument(node.object);
  }
  // 对象字面量
  if (node.type === 'ObjectExpression' && node.properties) {
    return node.properties.every(prop => prop && !prop.computed && isStaticArgument(prop.value));
  }
  // 数组字面量
  if (node.type === 'ArrayExpression' && node.elements) {
    return node.elements.every(elem => (elem ? isStaticArgument(elem) : true));
  }
  return false;
}

// 规范化成员表达式为完整名称 a.b.c
function getCalleeFullName(callee) {
  function walk(n) {
    if (n.type === 'Identifier') return n.name;
    if (n.type === 'ThisExpression') return 'this';
    if (n.type === 'MemberExpression') {
      const obj = walk(n.object);
      const prop = n.computed
        ? (n.property.type === 'StringLiteral' ? n.property.value : null)
        : (n.property.type === 'Identifier' ? n.property.name : null);
      if (!obj || !prop) return null;
      return obj + '.' + prop;
    }
    return null;
  }
  if (!callee) return null;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression') return walk(callee);
  return null;
}

// 非确定性函数集合（完全匹配）
const nonDeterministicSet = new Set([
  // 随机相关
  'Math.random',
  'crypto.randomBytes',
  'crypto.randomUUID',
  'crypto.randomInt',
  'uuid',
  'uuidv4',
  'randomUUID',
  // 时间相关
  'Date.now',
  // ID相关
  'nanoid',
  'ObjectId'
]);

function isNonDeterministicName(name) {
  return nonDeterministicSet.has(name);
}

// 检查函数调用是否是静态的（所有参数静态，且不是非确定性调用）
function isStaticFunctionCall(node) {
  if (node.type !== 'CallExpression') return false;
  const name = getCalleeFullName(node.callee);
  if (!name) return false;
  if (isNonDeterministicName(name)) return false;
  return node.arguments.every(arg => isStaticArgument(arg));
}

// 提取定义：函数、类、变量（对象/实例）
function extractDefinitions(ast) {
  const functions = {}; // 普通函数或对象属性函数：name -> FunctionDeclaration-like
  const classes = {};   // 类定义：className -> ClassDeclaration
  const variables = {}; // 变量声明：varName -> VariableDeclarator（含 init）

  traverse(ast, {
    FunctionDeclaration(path) {
      const name = path.node.id && path.node.id.name;
      if (name) functions[name] = path.node;
    },
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      if (!id || id.type !== 'Identifier') return;
      const name = id.name;
      // 变量可能是函数、对象字面量、new 表达式等
      if (init && (init.type === 'FunctionExpression' || init.type === 'ArrowFunctionExpression')) {
        const funcBody = (init.body && init.body.type === 'BlockStatement')
          ? init.body
          : { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument: init.body }] };
        functions[name] = {
          type: 'FunctionDeclaration',
          id: path.node.id,
          params: init.params,
          body: funcBody,
          async: init.async || false,
          generator: init.generator || false
        };
      } else if (init && (init.type === 'ObjectExpression' || init.type === 'NewExpression')) {
        variables[name] = path.node; // 只存具体 declarator，方便生成 "const name = init"
      }
    },
    ObjectProperty(path) {
      if (path.node.value && (path.node.value.type === 'FunctionExpression' || path.node.value.type === 'ArrowFunctionExpression')) {
        let name;
        if (path.node.key.type === 'Identifier') name = path.node.key.name;
        else if (path.node.key.type === 'StringLiteral') name = path.node.key.value;
        if (name) {
          const funcBody = (path.node.value.body && path.node.value.body.type === 'BlockStatement')
            ? path.node.value.body
            : { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument: path.node.value.body }] };
          functions[name] = {
            type: 'FunctionDeclaration',
            id: { type: 'Identifier', name },
            params: path.node.value.params,
            body: funcBody,
            async: path.node.value.async || false,
            generator: path.node.value.generator || false
          };
        }
      }
    },
    ClassDeclaration(path) {
      const className = path.node.id && path.node.id.name;
      if (className) classes[className] = path.node;
    }
  });

  return { functions, classes, variables };
}

// 提取静态函数调用
function extractStaticFunctionCalls(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy']
  });

  const staticCalls = [];
  traverse(ast, {
    CallExpression(path) {
      if (isStaticFunctionCall(path.node)) {
        staticCalls.push(path);
      }
    }
  });

  const { functions, classes, variables } = extractDefinitions(ast);
  const dependencies = analyzeFunctionDependencies(ast, staticCalls); // 仍保留现有分析，稍后可迭代改进
  return { ast,staticCalls, functionDefs: functions, classDefs: classes, varDefs: variables, dependencies };
}

// 组装并执行函数（严格模式：缺少定义则跳过，不创建占位对象）
function assembleAndExecuteFunctions(staticCalls, functionDefs, dependencies, classDefs, varDefs) {
  const results = [];

  const context = {
    console,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    Error,
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval
  };

  // 预定义所有普通函数与类
  Object.keys(functionDefs).forEach(name => {
    const funcAst = { type: 'Program', body: [functionDefs[name]], sourceType: 'script' };
    try {
      const { code } = generate(funcAst);
      vm.runInNewContext(code, context);
    } catch (e) {
      console.error(`定义函数 ${name} 失败:`, e);
    }
  });
  Object.keys(classDefs).forEach(name => {
    const classAst = { type: 'Program', body: [classDefs[name]], sourceType: 'script' };
    try {
      const { code } = generate(classAst);
      vm.runInNewContext(code, context);
    } catch (e) {
      console.error(`定义类 ${name} 失败:`, e);
    }
  });

  for (const callAst of staticCalls) {
    const call = callAst.node;
    const fullName = getCalleeFullName(call.callee);
    if (!fullName) { console.warn('无法识别的函数调用，跳过执行'); continue; }

    // 计算参数
    const args = call.arguments.map(arg => {
      const argAst = { type: 'Program', body: [{ type: 'ExpressionStatement', expression: arg }], sourceType: 'script' };
      const { code } = generate(argAst);
      try { return vm.runInNewContext(code.replace(/;$/, ''), context); } catch (e) { console.error('计算参数时出错:', e); return undefined; }
    });

    // 普通函数
    if (!fullName.includes('.')) {
      const funcName = fullName;
      if (typeof context[funcName] !== 'function') { console.warn(`函数 ${funcName} 未找到定义，跳过执行`); continue; }
      try {
        const result = context[funcName](...args);
        results.push({callAst, function: funcName, arguments: args, result });
      } catch (e) {
        console.error(`执行函数 ${funcName} 时出错:`, e);
      }
      continue;
    }

    // 成员方法：解析头标识
    const parts = fullName.split('.');
    const objName = parts[0];
    const methodName = parts[parts.length - 1];

    // 如果头是类名 => 静态方法
    if (classDefs[objName]) {
      // 从类中查找 static 方法
      const classNode = classDefs[objName];
      const staticMember = classNode.body.body.find(m => m.type === 'ClassMethod' && m.static && m.key && m.key.name === methodName);
      if (!staticMember) { console.warn(`类 ${objName} 未找到静态方法 ${methodName}，跳过执行`); continue; }
      // 确保类已在执行上下文中定义
      if (typeof context[objName] !== 'function') {
        const classAst = { type: 'Program', body: [classDefs[objName]], sourceType: 'script' };
        try {
          const { code } = generate(classAst);
          vm.runInNewContext(code, context);
        } catch (e) {
          console.error(`定义类 ${objName} 失败:`, e);
          continue;
        }
      }
      try {
        const result = context[objName][methodName](...args);
        results.push({callAst, function: `${objName}.${methodName}`, arguments: args, result });
      } catch (e) { console.error(`执行类静态方法 ${objName}.${methodName} 时出错:`, e); }
      continue;
    }

    // 如果头是变量名 => 对象或实例方法
    const decl = varDefs[objName];
    if (!decl) { console.warn(`对象/实例 ${objName} 未找到定义，跳过执行`); continue; }
    // 仅支持 ObjectExpression 或 NewExpression
    if (!decl.init || (decl.init.type !== 'ObjectExpression' && decl.init.type !== 'NewExpression')) {
      console.warn(`变量 ${objName} 的初始化不可识别（需 ObjectExpression 或 NewExpression），跳过执行`);
      continue;
    }
    // 如果是 new ClassName(...)，要求可静态构造
    if (decl.init.type === 'NewExpression') {
      const ctor = decl.init.callee;
      const className = ctor.type === 'Identifier' ? ctor.name : null;
      if (!className || !classDefs[className]) { console.warn(`实例 ${objName} 的类定义 ${className || '(未知)'} 不存在，跳过执行`); continue; }
      // 构造参数必须静态
      if (!decl.init.arguments.every(isStaticArgument)) { console.warn(`实例 ${objName} 的构造参数非静态，跳过执行`); continue; }
      // 确保类已在执行上下文中定义
      if (typeof context[className] !== 'function') {
        const classAst = { type: 'Program', body: [classDefs[className]], sourceType: 'script' };
        try {
          const { code } = generate(classAst);
          vm.runInNewContext(code, context);
        } catch (e) {
          console.error(`定义类 ${className} 失败:`, e);
          continue;
        }
      }
    }
    // 生成变量定义代码：const objName = <init>;
    if (Object.prototype.hasOwnProperty.call(context, objName)) {
      // 已定义，跳过重复定义
    } else {
      const varProg = {
        type: 'Program',
        body: [{
          type: 'VariableDeclaration',
          kind: 'var',
          declarations: [{ type: 'VariableDeclarator', id: decl.id, init: decl.init }]
        }],
        sourceType: 'script'
      };
      const { code: varCode } = generate(varProg);
      try { vm.runInNewContext(varCode, context); } catch (e) { console.error(`定义变量 ${objName} 时出错:`, e); continue; }
    }

    // 执行成员方法
    const target = context[objName];
    if (!target || typeof target[methodName] !== 'function') { console.warn(`对象/实例 ${objName} 没有方法 ${methodName}，跳过执行`); continue; }
    try {
      const result = target[methodName](...args);
      results.push({callAst, function: `${objName}.${methodName}`, arguments: args, result });
    } catch (e) { console.error(`执行 ${objName}.${methodName} 时出错:`, e); }
  }

  return results;
}



// 辅助函数：将JavaScript值转换为AST节点
function valueToAstNode(value) {
  if (value === null) {
    return { type: 'NullLiteral' };
  }
  
  if (value === undefined) {
    return { type: 'Identifier', name: 'undefined' };
  }
  
  switch (typeof value) {
    case 'string':
      return { type: 'StringLiteral', value: value };
    
    case 'number':
      if (Number.isNaN(value)) {
        return { type: 'Identifier', name: 'NaN' };
      }
      if (!Number.isFinite(value)) {
        return value > 0 
          ? { type: 'Identifier', name: 'Infinity' }
          : { type: 'UnaryExpression', operator: '-', argument: { type: 'Identifier', name: 'Infinity' } };
      }
      return { type: 'NumericLiteral', value: value };
    
    case 'boolean':
      return { type: 'BooleanLiteral', value: value };
    
    case 'object':
      if (Array.isArray(value)) {
        return {
          type: 'ArrayExpression',
          elements: value.map(item => valueToAstNode(item))
        };
      }
      
      // 普通对象
      const properties = Object.keys(value).map(key => ({
        type: 'ObjectProperty',
        key: { type: 'Identifier', name: key },
        value: valueToAstNode(value[key]),
        computed: false,
        shorthand: false
      }));
      
      return {
        type: 'ObjectExpression',
        properties: properties
      };
    
    default:
      // 对于函数、Symbol等复杂类型，返回注释节点
      console.warn(`无法将类型 ${typeof value} 转换为AST节点，保留原调用`);
      return null;
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('请提供要分析的JS文件路径');
    process.exit(1);
  }
  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    console.error(`文件 ${filePath} 不存在`);
    process.exit(1);
  }
  console.log(`分析文件: ${filePath}`);
  const {ast, staticCalls, functionDefs, classDefs, varDefs, dependencies } = extractStaticFunctionCalls(filePath);
  console.log(`找到 ${staticCalls.length} 个静态函数调用`);
  const results = assembleAndExecuteFunctions(staticCalls, functionDefs, dependencies, classDefs, varDefs);
  console.log('\n执行结果:');
  // console.log(JSON.stringify(results, null, 2));

  //替换静态函数调用为结果
 
  results.forEach((result, index) => {
    const callAst = result.callAst;
    const resultNode = valueToAstNode(result.result);
    if (resultNode) {
      const fnString = callAst.toString();
      callAst.replaceWith(resultNode);
      console.log('替换成功:',fnString, "=>", callAst.toString());
    }
  });
  const { code } = generate(ast);

  // 保存到文件
  fs.writeFileSync(filePath, code);
  
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  extractStaticFunctionCalls,
  assembleAndExecuteFunctions,
  isStaticFunctionCall
};



// 简化的依赖分析占位：当前不使用具体依赖关系
function analyzeFunctionDependencies(ast, staticCalls) {
  const m = new Map();
  staticCalls.forEach(call => m.set(call.node, new Set()));
  return m;
}


