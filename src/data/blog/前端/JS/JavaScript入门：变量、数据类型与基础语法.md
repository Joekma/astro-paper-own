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
series: JavaScript
language: zh-CN
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
const name = '字符串'
const count = 123
const isVisible = true
let emptyValue = undefined
const nullableValue = null

// 引用类型
const user = { name: '张三' }
const numbers = [1, 2, 3]
const greet = function() {
  return '你好'
}
```

## 运算符

```javascript
// 算术
const total = 10 + 2 - 3 * 4 / 2 % 3

// 比较
const isSame = total === 6
const isGreater = total > 3

// 逻辑
const canSubmit = isSame && !isGreater
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
