---
title: JavaScript基础语法
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: javascript-basics
description: 'JavaScript基础语法和数据类型'
tags:
  - JavaScript
  - 前端
  - 基础
  - 语法
category: 前端
draft: false
language: zh-CN
---

> JavaScript 是网页开发的核心语言，掌握基础语法是前端开发的必经之路。

## 基础语法

### 变量声明

```javascript
// var：函数作用域，可重复声明
var name = "Alice";

// let：块级作用域，不可重复声明
let age = 25;

// const：常量，不可重新赋值
const PI = 3.14159;
```

### 数据类型

```javascript
// 原始类型
let str = "Hello";           // 字符串
let num = 123;               // 数字
let bool = true;             // 布尔值
let empty = null;            // null
let undef = undefined;       // undefined
let sym = Symbol("id");       // Symbol
let bigInt = 9007199254740991n; // BigInt

// 引用类型
let arr = [1, 2, 3];         // 数组
let obj = { name: "Alice" };  // 对象
let func = function() {};    // 函数
```

### 类型判断

```javascript
typeof "hello"      // "string"
typeof 123          // "number"
typeof true         // "boolean"
typeof undefined    // "undefined"
typeof null         // "object" (历史遗留)
typeof {}           // "object"
typeof []           // "object"
Array.isArray([])   // true
```

## 运算符

### 算术运算符

```javascript
let a = 10, b = 3;
console.log(a + b);   // 13 加
console.log(a - b);   // 7  减
console.log(a * b);   // 30 乘
console.log(a / b);   // 3.333 除
console.log(a % b);   // 1  取余
console.log(a ** b);  // 1000 幂
console.log(++a);      // 11 自增
console.log(--a);      // 10 自减
```

### 比较运算符

```javascript
console.log(1 == "1");    // true (弱相等)
console.log(1 === "1");   // false (强相等)
console.log(1 != "1");    // false
console.log(1 !== "1");   // true
console.log(3 > 2);       // true
console.log(3 >= 3);      // true
```

### 逻辑运算符

```javascript
console.log(true && false);  // false
console.log(true || false);  // true
console.log(!true);          // false
console.log(0 || "default"); // "default" (短路求值)
```

## 流程控制

### 条件语句

```javascript
// if-else
if (score >= 90) {
    console.log("优秀");
} else if (score >= 60) {
    console.log("及格");
} else {
    console.log("不及格");
}

// 三元运算符
let result = score >= 60 ? "及格" : "不及格";

// switch
switch (grade) {
    case "A":
        console.log("90-100");
        break;
    case "B":
        console.log("80-90");
        break;
    default:
        console.log("其他");
}
```

### 循环语句

```javascript
// for 循环
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// for...in (遍历键)
for (let key in obj) {
    console.log(key);
}

// for...of (遍历值)
for (let item of arr) {
    console.log(item);
}

// while 循环
let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}

// do...while
do {
    console.log(i);
    i++;
} while (i < 5);
```

## 函数

### 函数声明

```javascript
// 函数声明
function greet(name) {
    return `Hello, ${name}!`;
}

// 函数表达式
const add = function(a, b) {
    return a + b;
};

// 箭头函数
const multiply = (a, b) => a * b;

// 默认参数
function greet(name = "World") {
    return `Hello, ${name}!`;
}
```

### 参数传递

```javascript
// 剩余参数
function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}

// 解构参数
function greet({ name, age }) {
    return `${name} is ${age} years old`;
}
```

## 数组操作

```javascript
let arr = [1, 2, 3, 4, 5];

// 遍历
arr.forEach(item => console.log(item));
arr.map(item => item * 2);
arr.filter(item => item > 2);
arr.reduce((sum, item) => sum + item, 0);

// 查找
arr.find(item => item > 2);
arr.findIndex(item => item > 2);
arr.includes(3);

// 新增删除
arr.push(6);
arr.pop();
arr.unshift(0);
arr.shift();
arr.splice(1, 2);
arr.slice(1, 3);

// 其他
arr.sort((a, b) => a - b);
arr.reverse();
arr.concat([6, 7]);
```

## 对象操作

```javascript
let obj = { name: "Alice", age: 25 };

// 访问
obj.name;
obj["name"];

// 添加删除
obj.gender = "female";
delete obj.age;

// 遍历
Object.keys(obj);
Object.values(obj);
Object.entries(obj);

// 解构
const { name, age } = obj;
const { name: userName } = obj;
```

## 小结

- **变量**：let、const 优先
- **类型**：原始类型和引用类型
- **函数**：声明、表达式、箭头函数
- **数组**：map、filter、reduce
- **对象**：解构、属性操作