---
title: JavaScript DOM操作
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: javascript-dom-manipulation
featured: false
draft: false
tags:
  - JavaScript
  - DOM
  - 前端
  - Web
description: 'JavaScript DOM操作，包括元素选择、属性控制、内容操作和事件处理'
series: JavaScript
seriesOrder: 5
language: zh-CN
---

> DOM（文档对象模型）是 JavaScript 操作网页内容的主要接口。

## 选择元素

### getElementById

```javascript
const element = document.getElementById('myId')
```

### getElementsBy

```javascript
const elements = document.getElementsByClassName('myClass')
const elements = document.getElementsByTagName('div')
const elements = document.getElementsByName('username')
```

### querySelector

```javascript
const element = document.querySelector('#myId')
const element = document.querySelector('.myClass')
const element = document.querySelector('div.container')
const element = document.querySelector('ul > li:first-child')
```

### querySelectorAll

```javascript
const elements = document.querySelectorAll('.item')
const elements = document.querySelectorAll('li.active')
```

### 遍历选择

```javascript
// 获取父元素
element.parentNode
element.parentElement

// 获取子元素
element.children           // 元素子节点
element.childNodes          // 所有子节点（包括文本）
element.firstChild
element.lastChild
element.firstElementChild
element.lastElementChild

// 获取兄弟元素
element.nextSibling
element.previousSibling
element.nextElementSibling
element.previousElementSibling
```

## 属性操作

### HTML 属性

```javascript
// 获取
element.getAttribute('href')
element.id
element.className
element.src
element.href

// 设置
element.setAttribute('href', 'http://example.com')
element.id = 'newId'
element.className = 'active'
element.src = 'image.jpg'

// 移除
element.removeAttribute('disabled')
```

### class 操作

```javascript
element.classList.add('active')
element.classList.remove('active')
element.classList.toggle('active')
element.classList.contains('active')
```

### data 属性

```javascript
// 设置
element.dataset.userId = '123'
element.dataset['userId'] = '123'

// 获取
const userId = element.dataset.userId
```

## 内容操作

### 文本内容

```javascript
element.textContent = '新文本'
const text = element.textContent
```

### HTML 内容

```javascript
element.innerHTML = '<b>新内容</b>'
const html = element.innerHTML
```

### 表单值

```javascript
inputElement.value = '新值'
const val = inputElement.value
```

## 样式操作

### style 属性

```javascript
element.style.color = 'red'
element.style.fontSize = '16px'
element.style.backgroundColor = '#fff'
```

### computed 样式

```javascript
const styles = window.getComputedStyle(element)
const color = styles.color
const width = styles.width
```

## DOM 操作

### 创建元素

```javascript
const div = document.createElement('div')
div.textContent = '新元素'
div.className = 'item'
```

### 添加元素

```javascript
parent.appendChild(div)           // 末尾添加
parent.insertBefore(div, target)  // 指定位置前插入
parent.append(div, text)          // 末尾添加多个
parent.prepend(div)               // 开头插入
```

### 删除元素

```javascript
element.remove()
parent.removeChild(element)
```

### 复制元素

```javascript
const clone = element.cloneNode()       // 浅克隆
const deepClone = element.cloneNode(true) // 深克隆
```

### 替换元素

```javascript
parent.replaceChild(newElement, oldElement)
```

## 尺寸和位置

### offset

```javascript
element.offsetParent    // 定位父元素
element.offsetTop      // 距父元素顶部
element.offsetLeft     // 距父元素左侧
element.offsetWidth    // 宽度（含 border + padding）
element.offsetHeight   // 高度
```

### client

```javascript
element.clientTop       // border 宽度
element.clientLeft      // border 宽度
element.clientWidth     // 宽度（含 padding，不含 border）
element.clientHeight    // 高度
```

### scroll

```javascript
element.scrollTop       // 滚动距离（垂直）
element.scrollLeft      // 滚动距离（水平）
element.scrollWidth      // 滚动宽度
element.scrollHeight     // 滚动高度
```

### getBoundingClientRect

```javascript
const rect = element.getBoundingClientRect()

rect.top        // 距视口顶部
rect.bottom     // 距视口底部
rect.left       // 距视口左侧
rect.right      // 距视口右侧
rect.width      // 宽度
rect.height     // 高度
rect.x          // x 坐标
rect.y          // y 坐标
```

## 事件处理

### 绑定事件

```javascript
element.addEventListener('click', function(e) {
    console.log('点击')
})

element.addEventListener('click', (e) => {
    console.log('点击')
})
```

### 移除事件

```javascript
function handleClick() {
    console.log('点击')
}

element.addEventListener('click', handleClick)
element.removeEventListener('click', handleClick)
```

### 事件委托

```javascript
parent.addEventListener('click', (e) => {
    if (e.target.matches('.item')) {
        console.log('点击了 item')
    }
})
```

### 常用事件

| 类别 | 事件 |
|------|------|
| 鼠标 | click、dblclick、mousedown、mouseup、mouseenter、mouseleave、mousemove、mouseover、mouseout |
| 键盘 | keydown、keyup、keypress |
| 表单 | focus、blur、input、change、submit、reset |
| 窗口 | load、DOMContentLoaded、resize、scroll、error |

### 事件对象

```javascript
element.addEventListener('click', (e) => {
    e.target           // 触发元素
    e.currentTarget    // 绑定元素
    e.type             // 事件类型
    e.clientX          // 鼠标 x
    e.clientY          // 鼠标 y
    e.preventDefault() // 阻止默认行为
    e.stopPropagation() // 阻止冒泡
})
```

## 小结

- **选择元素**：`getElementById`、`querySelector`
- **属性操作**：`getAttribute`、`setAttribute`、`classList`
- **内容操作**：`textContent`、`innerHTML`、`value`
- **DOM 操作**：`createElement`、`appendChild`、`remove`
- **尺寸位置**：`offset`、`client`、`scroll`、`getBoundingClientRect`
- **事件处理**：`addEventListener`、`事件委托`
