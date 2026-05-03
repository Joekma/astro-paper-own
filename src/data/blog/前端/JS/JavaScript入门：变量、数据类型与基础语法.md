---
title: JavaScript入门：变量、数据类型与基础语法
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: javascript-getting-started-guide
featured: false
draft: false
tags:
  - JavaScript
  - 前端开发
  - 编程入门
  - 变量
  - 数据类型
  - Web开发
description: 'JavaScript入门，讲解变量声明（var/let/const）、数据类型、运算符、控制结构等核心基础，快速掌握JavaScript编程基础'
---

> JavaScript 是 Web 开发的核心语言。

## 变量

```javascript
var name = '张三'     // 函数作用域
let age = 25           // 块级作用域
const PI = 3.14159    // 常量
```

## 数据类型

```javascript
// 基本类型
'字符串'
123
true
undefined
null

// 引用类型
{ name: '张三' }
[1, 2, 3]
function() {}
```

## 运算符

```javascript
// 算术
+ - * / %

// 比较
== === != !== > < >= <=

// 逻辑
&& || !
```

## 控制结构

```javascript
if (condition) { }
else if (condition) { }
else { }

for (let i = 0; i < 10; i++) { }
while (condition) { }

switch (value) {
    case 1: break
    default:
}
```

## 小结

- **变量**：var、let、const
- **类型**：字符串、数字、布尔、对象
- **运算符**：算术、比较、逻辑
- **控制**：if、for、while、switch
