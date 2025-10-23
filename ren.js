#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generator = require('@babel/generator').default;

  // 记录文件中所有被定义的变量,防止未来重命名的时候重复
class DefinedVariable {
  #definedVariables; // 使用私有字段隐藏 definedVariables

  constructor() {
    this.#definedVariables = new Set();
  }

  // 添加变量名到集合
  add(name) {
    if (typeof name !== 'string') {
      throw new TypeError('Variable name must be a string');
    }
    this.#definedVariables.add(name);
  }

  // 获取唯一变量名
  getUniqueName(newName) {
    if (typeof newName !== 'string') {
      throw new TypeError('Variable name must be a string');
    }

    if (!this.#definedVariables.has(newName)) {
      this.#definedVariables.add(newName);
      return newName;
    } else {
      // 如果 newName 以数字结尾，递增数字
      if (newName.match(/\d+$/)) {
        newName = newName.replace(/\d+$/, (num) => {
          return (parseInt(num) + 1).toString();
        });
      } else {
        // 如果不以数字结尾，添加 "1"
        newName = `${newName}1`;
      }
      return this.getUniqueName(newName); // 递归调用直到找到唯一名称
    }
  }
}

const definedVariable = new DefinedVariable();


function isObfuscated(name) {
  return /^[a-zA-Z0-9]{1,3}$/.test(name) || /^vRequire\d*$/.test(name) || /^v\d+$/.test(name);
}


function generateSuggestedNameFromModule(moduleName, isDestructuring = false) {

  // For custom modules (e.g., '../config/db')
  const baseName = path.basename(moduleName, path.extname(moduleName));
  const parts = baseName.split(/[-_/]/);
  const camelCase = parts.map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');

  let newName = isDestructuring ? camelCase : `${camelCase}`;

  return definedVariable.getUniqueName(newName);

}

function generateSuggestedNameFromExport(exportName) {
  return exportName;
}

function generateReport(renameMap) {
  let report = '重命名报告:\n==================================================\n';
  report += '导入重命名:\n';
  for (const [oldName, { newName, type }] of renameMap.entries()) {
    if (type === 'import') {
      report += `  ${oldName} -> ${newName}\n`;
    }
  }
  report += '\n导出重命名:\n';
  for (const [oldName, { newName, type }] of renameMap.entries()) {
    if (type === 'export') {
      report += `  ${oldName} -> ${newName}\n`;
    }
  }
  report += '\n内部传播:\n';
  for (const [oldName, { newName, type }] of renameMap.entries()) {
    if (type === 'internal') {
      report += `  ${oldName} -> ${newName}\n`;
    }
  }
  report += `总计重命名: ${renameMap.size} 个标识符\n`;
  return report;
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('使用方式: node rename.js <target-file> [renamed-file]');
    process.exit(1);
  }
  const renamedFilePath = process.argv[3] || filePath;

  console.log(`开始分析文件: ${filePath}`);

  const code = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  const renameMap = new Map(); // oldName -> { newName, type }



  traverse(ast, {
    VariableDeclarator(p) {
      // 处理变量声明
      if (t.isIdentifier(p.node.id)) {
        definedVariable.add(p.node.id.name);
      } else if (t.isObjectPattern(p.node.id)) {

        // 处理对象解构
        p.node.id.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
            definedVariable.add(prop.value.name);
          }
        });
      }
    }
  });

  // First pass: Analyze imports (require and destructuring)
  traverse(ast, {
    VariableDeclarator(p) {
      if (t.isCallExpression(p.node.init) && t.isIdentifier(p.node.init.callee, { name: 'require' })) {
        // p.node.init.arguments[0].type  必须是字符串
        if(!t.isStringLiteral(p.node.init.arguments[0])){
          return;
        }

        //p.node.init.arguments[0].type == 
        const moduleName = p.node.init.arguments[0].value;
        if (t.isIdentifier(p.node.id)) {
          const oldName = p.node.id.name;
          if (isObfuscated(oldName)) {
            const newName = generateSuggestedNameFromModule(moduleName);
            renameMap.set(oldName, { newName, type: 'import' });
          }
        } else if (t.isObjectPattern(p.node.id)) {
          // Handle destructuring: const { x, y } = require('module')
          p.node.id.properties.forEach(prop => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
              const oldName = prop.value.name;
              const exportName = prop.key.name || prop.key.value;
              if (isObfuscated(oldName)) {
                const newName = `${generateSuggestedNameFromModule(moduleName, true)}${exportName.charAt(0).toUpperCase() + exportName.slice(1)}`;
                renameMap.set(oldName, { newName, type: 'import' });
              }
            }
          });
        }
      } else if (t.isMemberExpression(p.node.init)) {
        // Handle cases like const v22 = vRequire.sequelize
        const objectName = p.node.init.object.name;
        const propertyName = p.node.init.property.name;
        const oldName = p.node.id.name;
        if (renameMap.has(objectName) && isObfuscated(oldName)) {
          const { newName: importedNewName } = renameMap.get(objectName);
          const newName = `${importedNewName}${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`;
          renameMap.set(oldName, { newName, type: 'internal' });
        }
      }
    }
  });

  // Second pass: Analyze exports
  traverse(ast, {
    AssignmentExpression(p) {
      if (t.isMemberExpression(p.node.left)) {
        if (p.node.left.object.name === 'module' && p.node.left.property.name === 'exports') {
          if (t.isObjectExpression(p.node.right)) {
            p.node.right.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key) && t.isIdentifier(prop.value)) {
                const exportName = prop.key.name;
                const oldName = prop.value.name;
                if (isObfuscated(oldName)) {
                  const newName = generateSuggestedNameFromExport(exportName);
                  renameMap.set(oldName, { newName, type: 'export' });
                }
              }
            });
          } else if (t.isIdentifier(p.node.right)) {
            const oldName = p.node.right.name;
            if (isObfuscated(oldName)) {
              const newName = 'moduleExport';
              renameMap.set(oldName, { newName, type: 'export' });
            }
          }
        } else if (p.node.left.object.name === 'exports' && t.isIdentifier(p.node.left.property)) {
          const exportName = p.node.left.property.name;
          if (t.isIdentifier(p.node.right)) {
            const oldName = p.node.right.name;
            if (isObfuscated(oldName)) {
              const newName = generateSuggestedNameFromExport(exportName);
              renameMap.set(oldName, { newName, type: 'export' });
            }
          }
        }
      }
    },
    ExportNamedDeclaration(p) {
      if (p.node.declaration && t.isVariableDeclaration(p.node.declaration)) {
        p.node.declaration.declarations.forEach(decl => {
          if (t.isIdentifier(decl.id)) {
            const oldName = decl.id.name;
            if (isObfuscated(oldName)) {
              const newName = 'exported' + oldName.toUpperCase();
              renameMap.set(oldName, { newName, type: 'export' });
            }
          }
        });
      }
    },
    ExportDefaultDeclaration(p) {
      if (t.isIdentifier(p.node.declaration)) {
        const oldName = p.node.declaration.name;
        if (isObfuscated(oldName)) {
          const newName = 'defaultExport';
          renameMap.set(oldName, { newName, type: 'export' });
        }
      }
    }
  });

  // Apply renames using scope.rename for safety
  traverse(ast, {
    Program(p) {
      for (const [oldName, { newName }] of renameMap) {
        const binding = p.scope.getBinding(oldName);
        if (binding) {
          try {
            binding.scope.rename(oldName, newName);
          } catch (e) {
            console.warn(`无法重命名 ${oldName} 到 ${newName}: ${e.message}`);
          }
        }
      }
    }
  });

  // Generate new code
  const { code: newCode } = generator(ast, { retainLines: false, concise: false });

  // Write to file
  const dir = path.dirname(filePath);
  // const baseName = path.basename(filePath, path.extname(filePath));
  // const newFilePath = path.join(dir, `${baseName}_renamed.js`);
  fs.writeFileSync(renamedFilePath, newCode);

  // Output report
  console.log('发现导入项:');
  for (const [old, { newName, type }] of renameMap) {
    if (type === 'import') {
      console.log(`  ${old} -> ${newName}`);
    }
  }
  console.log('发现导出项:');
  for (const [old, { newName, type }] of renameMap) {
    if (type === 'export') {
      console.log(`  ${old} -> ${newName}`);
    }
  }
  console.log('重命名完成!');
  console.log(`新文件已生成: ${renamedFilePath}`);
  
  console.log(generateReport(renameMap));
}

main();