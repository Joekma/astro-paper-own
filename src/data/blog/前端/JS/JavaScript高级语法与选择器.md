---
title: JavaScript高级语法与选择器
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: javascript-advanced-syntax
featured: false
draft: false
tags:
  - JavaScript
  - 前端
  - Web
  - 高级
description: 'JavaScript高级语法，包括原型链、闭包、作用域链和DOM选择器'
series: JavaScript
seriesOrder: 8
language: zh-CN
---

> JavaScript 高级特性包括原型链、闭包、作用域等。

## 原型链

```javascript
function Person(name) {
    this.name = name
}

Person.prototype.greet = function() {
    return `Hello, ${this.name}`
}

const p = new Person('张三')
console.log(p.greet())
```

## 闭包

```javascript
function createCounter() {
    let count = 0
    return function() {
        count++
        return count
    }
}

const counter = createCounter()
console.log(counter())  // 1
console.log(counter())  // 2
```

## 作用域链

```javascript
let globalVar = '全局'

function outer() {
    let outerVar = '外部'
    
    function inner() {
        let innerVar = '内部'
        console.log(globalVar)   // 可访问
        console.log(outerVar)    // 可访问
    }
    
    inner()
    console.log(innerVar)  // 错误！
}
```

## DOM 选择器

```javascript
document.getElementById('id')
document.getElementsByClassName('class')
document.getElementsByTagName('div')
document.querySelector('.class')
document.querySelectorAll('div')
```

## 小结

- **原型链**：对象继承机制
- **闭包**：函数访问外部变量
- **作用域**：变量访问范围
- **选择器**：DOM 元素查询
