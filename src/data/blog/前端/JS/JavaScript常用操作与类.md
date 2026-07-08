---
title: JavaScript常用操作与类
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: javascript-common-operations
featured: false
draft: false
tags:
  - JavaScript
  - 前端
  - Web
  - 编程
description: 'JavaScript常用操作，包括字符串、数组、日期、正则等核心API'
series: JavaScript
seriesOrder: 7
language: zh-CN
---

> JavaScript 提供了丰富的内置对象和 API，用于处理各种数据类型和操作。

## 字符串 String

### 创建

```javascript
const str = 'Hello World'
const str2 = new String('Hello')
```

### 常用方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `length` | 长度 | `'hello'.length` |
| `charAt()` | 字符 | `'hello'.charAt(1)` |
| `indexOf()` | 索引 | `'hello'.indexOf('l')` |
| `substring()` | 截取 | `'hello'.substring(1, 3)` |
| `split()` | 分割 | `'a,b,c'.split(',')` |
| `replace()` | 替换 | `'hello'.replace('l', 'L')` |
| `toUpperCase()` | 大写 | `'hello'.toUpperCase()` |
| `toLowerCase()` | 小写 | `'HELLO'.toLowerCase()` |
| `trim()` | 去空格 | `' hello '.trim()` |
| `includes()` | 包含 | `'hello'.includes('ll')` |
| `startsWith()` | 开头 | `'hello'.startsWith('he')` |
| `endsWith()` | 结尾 | `'hello'.endsWith('lo')` |
| `padStart()` | 头部填充 | `'5'.padStart(3, '0')` |
| `padEnd()` | 尾部填充 | `'5'.padEnd(3, '0')` |

### 模板字符串

```javascript
const name = '张三'
const age = 25
const str = `我叫${name}，今年${age}岁`
```

## 数组 Array

### 创建

```javascript
const arr = [1, 2, 3]
const arr2 = new Array(4, 5, 6)
const arr3 = new Array(5)  // 长度为5的空数组
```

### 常用方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `push()` | 末尾添加 | 新长度 |
| `pop()` | 末尾删除 | 删除元素 |
| `unshift()` | 开头添加 | 新长度 |
| `shift()` | 开头删除 | 删除元素 |
| `splice()` | 插入/删除 | 删除元素数组 |
| `slice()` | 截取 | 新数组 |
| `concat()` | 合并 | 新数组 |
| `join()` | 转字符串 | 字符串 |
| `reverse()` | 反转 | 新数组 |
| `sort()` | 排序 | 新数组 |

### 高阶方法

```javascript
// map - 映射
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]

// filter - 过滤
[1, 2, 3, 4].filter(x => x > 2)  // [3, 4]

// reduce - 累计
[1, 2, 3].reduce((sum, x) => sum + x, 0)  // 6

// find - 查找
[1, 2, 3].find(x => x > 1)  // 2

// findIndex - 查找索引
[1, 2, 3].findIndex(x => x > 1)  // 1

// some - 是否存在
[1, 2, 3].some(x => x > 2)  // true

// every - 是否都满足
[1, 2, 3].every(x => x > 0)  // true

// flat - 扁平化
[1, [2, [3]]].flat(2)  // [1, 2, 3]
```

### 遍历

```javascript
[1, 2, 3].forEach((item, index) => {
    console.log(index, item)
})

for (const item of [1, 2, 3]) {
    console.log(item)
}
```

## 对象 Object

### 创建

```javascript
const obj = {name: '张三', age: 25}
const obj2 = new Object()
```

### 操作

```javascript
// 获取
obj.name
obj['name']

// 设置
obj.gender = '男'

// 删除
delete obj.age

// 合并
Object.assign(obj, {name: '李四'})

// 拷贝
const copy = {...obj}
const deepCopy = JSON.parse(JSON.stringify(obj))
```

### 方法

```javascript
Object.keys(obj)      // ['name', 'gender']
Object.values(obj)    // ['李四', '男']
Object.entries(obj)   // [['name', '李四'], ['gender', '男']]
Object.hasOwnProperty('name')  // true
Object.assign({}, obj)         // 拷贝
```

### 解构

```javascript
const {name, age} = obj
const {name: userName} = obj  // 重命名
const {name = '默认'} = obj   // 默认值
```

## 日期 Date

### 创建

```javascript
const now = new Date()
const date = new Date('2024-01-01')
const date2 = new Date(2024, 0, 1)  // 月从0开始
```

### 获取

```javascript
now.getFullYear()      // 年
now.getMonth()         // 月 (0-11)
now.getDate()          // 日 (1-31)
now.getDay()           // 星期 (0-6)
now.getHours()         // 时 (0-23)
now.getMinutes()       // 分 (0-59)
now.getSeconds()       // 秒 (0-59)
now.getMilliseconds()  // 毫秒
now.getTime()          // 时间戳
```

### 设置

```javascript
now.setFullYear(2025)
now.setMonth(5)        // 6月
now.setDate(15)
now.setHours(12)
```

### 格式化

```javascript
now.toLocaleDateString()      // '2024/1/1'
now.toLocaleTimeString()      // '上午12:00:00'
now.toLocaleString()          // '2024/1/1 上午12:00:00'

// 自定义格式
const format = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}
```

## JSON

### 方法

```javascript
const obj = {name: '张三', age: 25}

// 转字符串
const str = JSON.stringify(obj)
const str2 = JSON.stringify(obj, null, 2)  // 格式化

// 转对象
const newObj = JSON.parse(str)

// 深拷贝
const copy = JSON.parse(JSON.stringify(obj))
```

### 处理日期

```javascript
// JSON.stringify 可接收 replacer
const date = new Date()
const obj = {
    date: date,
    toJSON: () => date.toISOString()
}
```

## 正则表达式 RegExp

### 创建

```javascript
const reg = /pattern/g
const reg2 = new RegExp('pattern', 'gi')
```

### 标志

| 标志 | 说明 |
|------|------|
| `g` | 全局匹配 |
| `i` | 忽略大小写 |
| `m` | 多行模式 |
| `s` | dotAll 模式 |
| `u` | Unicode |

### 方法

```javascript
const str = 'Hello World';

/hello/.test(str)            // false (大小写)
/hello/i.test(str)           // true
/hello/i.exec(str)           // ['hello', index: 0, input: 'Hello World']

str.match(/o/g)              // ['o', 'o']
str.replace(/o/g, 'O')        // 'HellO WOrld'
str.split(/o/i)              // ['Hell', ' W', 'rld']
```

### 常用正则

```javascript
// 手机号
const phoneReg = /^1[3-9]\d{9}$/;

// 邮箱
const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// URL
const urlReg = /https?:\/\/[\w\-.]+(:\d+)?(\/[\w\-./?%&=]*)?/;

// 身份证
const idCardReg = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

// 密码强度
const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
```

## 数字 Number

### 方法

```javascript
const num = 123.456

Number.isInteger(123)       // true
Number.isNaN(NaN)            // true
Number.parseFloat('12.34')  // 12.34
Number.parseInt('12.34')     // 12

num.toFixed(2)               // '123.46'
num.toPrecision(4)           // '123.5'
(123).toString()             // '123'
```

### Math

```javascript
Math.abs(-5)                // 5
Math.ceil(1.2)              // 2
Math.floor(1.8)             // 1
Math.round(1.5)             // 2
Math.max(1, 2, 3)           // 3
Math.min(1, 2, 3)          // 1
Math.pow(2, 3)             // 8
Math.sqrt(9)                // 3
Math.random()              // 0-1随机数
Math.PI                     // 3.14159...
Math.E                      // 2.71828...
```

## 小结

- **字符串**：模板字符串、常用方法
- **数组**：push/pop/map/filter/reduce
- **对象**：解构、拷贝、合并
- **日期**：获取、设置、格式化
- **JSON**：.stringify/parse
- **正则**：test/exec/match/replace
- **数字**：toFixed、Math
