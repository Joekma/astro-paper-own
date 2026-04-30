---
title: JavaScript基础语法
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: javascript-basics
description: 'JavaScript基础语法，包括变量、数据类型、运算符、控制结构等核心概念'
tags:
  - JavaScript
  - 前端
  - Web
category: 前端
draft: false
language: zh-CN
---

> JavaScript 是一种运行在浏览器端的脚本语言，用于实现网页的交互效果。

## JavaScript 引入方式

### 1. 行内式（不推荐）

```html
<button onclick="alert('点击')">按钮</button>
```

### 2. 内联式

```html
<script>
    alert('页面加载完成');
</script>
```

### 3. 外部文件（推荐）

```html
<script src="main.js"></script>
```

## 变量

### 变量声明

| 关键字 | 作用域 | 可重新赋值 | 可重新声明 |
|--------|--------|-----------|-----------|
| `var` | 函数作用域 | ✅ | ✅ |
| `let` | 块级作用域 | ✅ | ❌ |
| `const` | 块级作用域 | ❌ | ❌ |

```javascript
var name = '张三';      // 函数作用域
let age = 25;           // 块级作用域
const PI = 3.14159;     // 常量，不能修改
```

### 命名规范

- 字母、数字、下划线、`$` 组成
- 不能以数字开头
- 区分大小写
- 建议使用小驼峰命名

## 数据类型

### 基本类型

| 类型 | 示例 | 说明 |
|------|------|------|
| **String** | `'hello'`、`"world"` | 字符串 |
| **Number** | `123`、`3.14` | 数字 |
| **Boolean** | `true`、`false` | 布尔值 |
| **Undefined** | `undefined` | 未定义 |
| **Null** | `null` | 空值 |
| **Symbol** | `Symbol('id')` | 唯一标识 |
| **BigInt** | `9007199254740991n` | 大整数 |

### 引用类型

```javascript
// 对象
let obj = { name: '张三', age: 25 };

// 数组
let arr = [1, 2, 3, 4, 5];

// 函数
function sayHello() {
    console.log('Hello');
}
```

### 类型检测

```javascript
typeof 'hello'     // "string"
typeof 123         // "number"
typeof true        // "boolean"
typeof undefined   // "undefined"
typeof null        // "object"  // 历史遗留问题
typeof {}          // "object"
typeof []          // "object"
Array.isArray([])  // true
```

## 运算符

### 算术运算符

```javascript
let a = 10, b = 3;
console.log(a + b);   // 13 加
console.log(a - b);   // 7  减
console.log(a * b);   // 30 乘
console.log(a / b);   // 3.333... 除
console.log(a % b);   // 1  取余
console.log(a ** b);   // 1000 幂
console.log(++a);     // 11 自增
console.log(--b);     // 2  自减
```

### 比较运算符

```javascript
console.log(10 == '10');    // true  松散相等
console.log(10 === '10');   // false 严格相等
console.log(10 != '10');    // false
console.log(10 !== '10');   // true
console.log(5 > 3);         // true
console.log(5 >= 5);       // true
```

### 逻辑运算符

```javascript
console.log(true && false);  // false 逻辑与
console.log(true || false);  // true  逻辑或
console.log(!true);          // false 取反
```

## 控制结构

### 条件语句

```javascript
// if-else
if (age >= 18) {
    console.log('成年');
} else if (age >= 12) {
    console.log('青少年');
} else {
    console.log('儿童');
}

// 三元运算符
let result = age >= 18 ? '成年' : '未成年';

// switch
switch (day) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
        console.log('工作日');
        break;
    case 6:
    case 7:
        console.log('周末');
        break;
    default:
        console.log('无效日期');
}
```

### 循环语句

```javascript
// for 循环
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// while 循环
let count = 0;
while (count < 5) {
    console.log(count);
    count++;
}

// do-while 循环
do {
    console.log(count);
    count--;
} while (count > 0);

// for...of（遍历数组）
for (let item of [1, 2, 3]) {
    console.log(item);
}

// for...in（遍历对象）
for (let key in {a: 1, b: 2}) {
    console.log(key);
}
```

## 函数

### 函数声明

```javascript
// 函数声明
function greet(name) {
    return `Hello, ${name}`;
}

// 函数表达式
const add = function(a, b) {
    return a + b;
};

// 箭头函数
const multiply = (a, b) => a * b;

// 默认参数
function greet(name = 'World') {
    return `Hello, ${name}`;
}
```

### 函数参数

```javascript
// 剩余参数
function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4);  // 10

// 解构参数
function printUser({ name, age }) {
    console.log(`${name}, ${age}`);
}
printUser({ name: '张三', age: 25 });
```

## 数组

### 基本操作

```javascript
let arr = [1, 2, 3, 4, 5];

// 添加元素
arr.push(6);           // 末尾添加
arr.unshift(0);       // 开头添加

// 删除元素
arr.pop();             // 末尾删除
arr.shift();           // 开头删除

// 切片
arr.slice(1, 3);      // [2, 3]

// 合并
arr.concat([7, 8]);

// 查找
arr.indexOf(3);        // 2
arr.includes(3);      // true
```

### 高阶方法

```javascript
// map - 映射
[1, 2, 3].map(x => x * 2);  // [2, 4, 6]

// filter - 过滤
[1, 2, 3, 4].filter(x => x > 2);  // [3, 4]

// reduce - 累计
[1, 2, 3].reduce((sum, x) => sum + x, 0);  // 6

// find - 查找
[1, 2, 3].find(x => x > 1);  // 2

// some/every - 判断
[1, 2, 3].some(x => x > 2);   // true
[1, 2, 3].every(x => x > 0);  // true
```

## 对象

### 基本操作

```javascript
let user = {
    name: '张三',
    age: 25,
    sayHi: function() {
        console.log('Hi');
    }
};

// 访问属性
user.name;          // 张三
user['name'];       // 张三

// 添加属性
user.gender = '男';

// 删除属性
delete user.age;

// 方法简写
let user = {
    name: '张三',
    sayHi() {
        console.log('Hi');
    }
};
```

### 解构赋值

```javascript
let { name, age } = { name: '张三', age: 25 };

// 重命名
let { name: userName } = { name: '张三' };

// 默认值
let { gender = '未知' } = { name: '张三' };
```

## 字符串

### 常用方法

```javascript
let str = 'Hello World';

// 长度
str.length;  // 11

// 查找
str.indexOf('World');     // 6
str.includes('Hello');    // true
str.startsWith('Hello'); // true
str.endsWith('World');   // true

// 提取
str.slice(0, 5);      // Hello
str.substring(0, 5);  // Hello
str.substr(0, 5);    // Hello（已废弃）

// 替换
str.replace('World', 'JavaScript');

// 分割
str.split(' ');  // ['Hello', 'World']

// 大小写
str.toUpperCase();  // HELLO WORLD
str.toLowerCase();  // hello world

// 去除空白
'  Hello  '.trim();  // Hello
```

## 调试方法

| 方法 | 说明 |
|------|------|
| `console.log()` | 控制台输出 |
| `console.warn()` | 警告信息 |
| `console.error()` | 错误信息 |
| `alert()` | 弹出框 |
| `prompt()` | 输入框 |
| `debugger` | 断点调试 |

## 小结

- **变量**：`var`、`let`、`const`
- **数据类型**：基本类型 + 引用类型
- **运算符**：算术、比较、逻辑
- **控制结构**：条件、循环
- **函数**：声明、表达式、箭头函数
- **数组**：push、pop、map、filter、reduce
- **对象**：属性、方法、解构
