---
title: ES6新特性介绍
series: Vue
seriesOrder: 7
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: es6-javascript-tutorial
featured: false
draft: false
tags:
  - JavaScript
  - ES6
  - 前端
  - Web
description: 'ES6新特性介绍，包括let、const、箭头函数、模板字符串、解构、Promise等'
---

> ES6（ECMAScript 2015）是 JavaScript 的重要更新，引入许多新语法和特性。

## 变量声明

### let 和 const

```javascript
// let - 块级作用域，可重新赋值
let count = 0
count = 1

// const - 块级作用域，不可重新赋值
const PI = 3.14159
// PI = 3  // 错误！

// const 对象
const user = { name: '张三' }
user.name = '李四'  // 允许！对象本身不可变，但属性可改
```

### 块级作用域

```javascript
if (true) {
    let a = 1
    const b = 2
}
// console.log(a)  // 错误！a 未定义
```

## 箭头函数

### 基本语法

```javascript
// 传统函数
function sum(a, b) {
    return a + b
}

// 箭头函数
const sum = (a, b) => a + b

// 单参数可省略括号
const double = x => x * 2

// 多行函数体
const greet = name => {
    const message = `Hello, ${name}`
    return message
}
```

### this 绑定

```javascript
// 传统函数 this 指向调用者
function Timer() {
    this.time = 0
    setInterval(function() {
        this.time++  // this 指向 window
    }, 1000)
}

// 箭头函数不绑定 this
function Timer() {
    this.time = 0
    setInterval(() => {
        this.time++  // this 指向 Timer 实例
    }, 1000)
}
```

## 模板字符串

```javascript
const name = '张三'
const age = 25

// 传统写法
const msg = '我叫' + name + '，今年' + age + '岁'

// 模板字符串
const msg = `我叫${name}，今年${age}岁`

// 多行
const html = `
    <div>
        <h1>${name}</h1>
        <p>年龄：${age}</p>
    </div>
`
```

## 解构赋值

### 数组解构

```javascript
const [a, b, c] = [1, 2, 3]
console.log(a, b, c)  // 1 2 3

// 跳过元素
const [first, , third] = [1, 2, 3]
console.log(first, third)  // 1 3

// 默认值
const [x = 0] = []
console.log(x)  // 0

// 剩余模式
const [head, ...tail] = [1, 2, 3, 4]
console.log(head, tail)  // 1 [2, 3, 4]
```

### 对象解构

```javascript
const { name, age } = { name: '张三', age: 25 }
console.log(name, age)  // 张三 25

// 重命名
const { name: userName } = { name: '张三' }
console.log(userName)  // 张三

// 默认值
const { gender = '未知' } = { name: '张三' }
console.log(gender)  // 未知

// 剩余模式
const { name, ...rest } = { name: '张三', age: 25, gender: '男' }
console.log(name, rest)  // 张三 { age: 25, gender: '男' }
```

### 函数参数解构

```javascript
function printUser({ name, age }) {
    console.log(`${name} - ${age}`)
}

printUser({ name: '张三', age: 25 })
```

## 扩展运算符

### 数组扩展

```javascript
// 合并数组
const arr1 = [1, 2]
const arr2 = [3, 4]
const merged = [...arr1, ...arr2]  // [1, 2, 3, 4]

// 复制数组
const copy = [...arr1]

// 函数参数
const numbers = [1, 2, 3, 4, 5]
console.log(Math.max(...numbers))  // 5
```

### 对象扩展

```javascript
const obj1 = { a: 1, b: 2 }
const obj2 = { c: 3 }

// 合并对象
const merged = { ...obj1, ...obj2 }

// 复制对象
const copy = { ...obj1 }

// 覆盖属性
const updated = { ...obj1, b: 10 }
```

## Promise

### 基本用法

```javascript
const promise = new Promise((resolve, reject) => {
    // 异步操作
    if (success) {
        resolve(result)
    } else {
        reject(error)
    }
})

promise
    .then(result => console.log(result))
    .catch(error => console.error(error))
    .finally(() => console.log('完成'))
```

### 链式调用

```javascript
fetch('/api/user')
    .then(response => response.json())
    .then(user => fetch(`/api/posts/${user.id}`))
    .then(response => response.json())
    .then(posts => console.log(posts))
    .catch(error => console.error(error))
```

### Promise.all

```javascript
const promises = [
    fetch('/api/users'),
    fetch('/api/posts'),
    fetch('/api/comments')
]

Promise.all(promises)
    .then(([users, posts, comments]) => {
        console.log(users, posts, comments)
    })
```

## async/await

### 基本语法

```javascript
async function fetchData() {
    try {
        const response = await fetch('/api/data')
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error:', error)
    }
}

// 调用
fetchData().then(data => console.log(data))
```

### 并行执行

```javascript
async function fetchAll() {
    const [users, posts] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/posts').then(r => r.json())
    ])
    return { users, posts }
}
```

## 模块

### export

```javascript
// 命名导出
export const name = '张三'
export function greet() { return 'Hello' }

// 默认导出
export default class User { }
```

### import

```javascript
// 命名导入
import { name, greet } from './module'

// 重命名导入
import { name as userName } from './module'

// 默认导入
import User from './module'

// 导入所有
import * as module from './module'
module.name
```

## 其他特性

### for...of

```javascript
const arr = [1, 2, 3]
for (const item of arr) {
    console.log(item)
}

const str = 'hello'
for (const char of str) {
    console.log(char)
}
```

### class

```javascript
class User {
    constructor(name, age) {
        this.name = name
        this.age = age
    }

    greet() {
        return `Hello, ${this.name}`
    }

    static create(name) {
        return new User(name, 0)
    }
}

const user = new User('张三', 25)
console.log(user.greet())

const admin = User.create('管理员')
```

### Map 和 Set

```javascript
// Map - 键值对
const map = new Map()
map.set('name', '张三')
map.get('name')  // 张三
map.has('name')  // true
map.delete('name')

// Set - 唯一值集合
const set = new Set([1, 2, 2, 3])
set.add(4)
set.has(1)  // true
set.size  // 4
```

## 小结

- **let/const**：块级作用域变量
- **箭头函数**：简化语法，固定 this
- **模板字符串**：更方便的字符串拼接
- **解构**：快速提取对象/数组属性
- **扩展运算符**：合并、复制数组和对象
- **Promise**：异步编程解决方案
- **async/await**：Promise 的语法糖
- **模块**：import/export
