#!/usr/bin/env node

const myAtob = require("atob")
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
// constMsg.js
/*
module.exports = {
  CREATE_SUCCESS: "JUU1JTg4JTlCJUU1JUJCJUJBJUU2JTg4JTkwJUU1JThBJTlG",
  CREATE_PARAM_FAIL: "JUU1JTg4JTlCJUU1JUJCJUJBJUU1JUE0JUIxJUU4JUI0JUE1JUVGJUJDJThDJUU1JThGJTgyJUU2JTk1JUIwJUU0JUI4JThEJUU1JTkwJTg4JUU2JUIzJTk1JUVGJUJDJTgx",
  CREATE_FAIL_NAME_EXIST: "JUU1JTg4JTlCJUU1JUJCJUJBJUU1JUE0JUIxJUU4JUI0JUE1JUVGJUJDJThDJUU1JTkwJThEJUU3JUE3JUIwJUU1JUI3JUIyJUU1JUFEJTk4JUU1JTlDJUE4JUVGJUJDJTgx",
}
  */

// CLI 指定文件路径，对指定文件进行解密，并将解密后的内容写入到指定文件中，不指定输出文件就覆盖
const fs = require("fs")
const path = require("path")
const { program } = require("commander")
function b64DecodeUnicode(str) {
    if(str.startsWith("JUU")){
        try {
            return decodeURIComponent(decodeURIComponent(myAtob(str).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));
        } catch (e) {
            return str
        }
    }
    else{
        return str;
    }
}
function processFileContent(content) {
    // 替换 module.exports 对象里面的所有属性的值，调用 b64DecodeUnicode 函数
    let ast = parser.parse(content, {
        sourceType: 'module',
    });

    traverse(ast, {
        // StringLiteral(path) {
        //     const value = path.node.value;
        //     // 将解码后的值直接设置，让生成器使用实际字符
        //     path.node.value = value;
        //     // 清除任何可能影响输出的额外信息
        //     if (path.node.extra) {
        //         delete path.node.extra;
        //     }
        // },
        // 遍历所有的属性节点
        Property(path) {
            // 获取属性，和对应的值，尝试通过 b64DecodeUnicode 解密，解密成功就替换
            const prop = path.node;
            if (prop.value.type === 'StringLiteral') {
                console.log(prop.value.value);
                prop.value.value = b64DecodeUnicode(prop.value.value);
                // PROJECT_COUNT: "\u9879\u76EE\u4E2A\u6570", 需要再次解密成人可读的

                prop.value.extra = undefined; // 清除extra信息，让生成器使用实际字符
            }
        }
    });
    let newContent = generate(ast, {
        jsescOption: {
            minimal: false // 不使用转义，输出实际字符
        }
    }, content).code;


    // 后处理：将 Unicode 转义序列转换为实际字符
    newContent = newContent.replace(/\\u([\dA-Fa-f]{4})/g, (match, codePoint) => {
        return String.fromCharCode(parseInt(codePoint, 16));
    });


    return newContent
}

program
    .version("0.0.1")
    .description("解密 constMsg.js 中的常量消息")
    .option("-i, --input <file>", "指定输入文件路径")
    .option("-o, --output <file>", "指定输出文件路径")
    .parse(process.argv)
const { input, output } = program.opts()
if (!input) {
    console.error("请指定输入文件路径")
    program.help()
    process.exit(1)
}
const inputPath = path.resolve(input)
const outputPath = output ? path.resolve(output) : inputPath
const content = fs.readFileSync(inputPath, "utf8")
const decodedContent = processFileContent(content)
fs.writeFileSync(outputPath, decodedContent, "utf8")
console.log(`解密完成，已将内容写入到 ${outputPath}`)
