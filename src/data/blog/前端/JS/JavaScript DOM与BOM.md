---
title: JavaScript DOM与BOM
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: javascript-dom-bom-complete-guide
featured: false
draft: false
tags:
  - JavaScript
  - DOM
  - BOM
  - 前端开发
  - 盒模型
  - 事件模型
  - 动画
  - Web开发
description: '系统讲解JavaScript DOM和BOM核心知识，包含DOM节点操作、BOM对象模型、盒模型、事件模型、requestAnimationFrame动画等'
---

> JavaScript 通过 DOM 和 BOM 两大对象模型与浏览器进行交互。

## DOM（文档对象模型）

### DOM 树结构

```
document
└── html
    ├── head
    │   ├── title
    │   ├── meta
    │   └── link
    └── body
        ├── div
        ├── p
        └── script
```

### DOM 节点类型

| 类型 | nodeType | 说明 |
|------|-----------|------|
| 元素节点 | 1 | HTML 标签 |
| 属性节点 | 2 | 标签属性 |
| 文本节点 | 3 | 文本内容 |
| 注释节点 | 8 | 注释 |
| 文档节点 | 9 | document |

### 节点属性

```javascript
element.nodeName      // 节点名称
element.nodeType      // 节点类型
element.nodeValue     // 节点值

element.childNodes    // 子节点列表
element.parentNode    // 父节点
element.firstChild    // 第一个子节点
element.lastChild     // 最后一个子节点
```

## BOM（浏览器对象模型）

### window 对象

```javascript
// 尺寸
window.innerWidth     // 视口宽度
window.innerHeight    // 视口高度
window.outerWidth     // 浏览器宽度
window.outerHeight    // 浏览器高度

// 方法
window.open('url', 'name', 'width=500,height=300')
window.close()
window.resizeTo(500, 500)
window.moveTo(100, 100)

// 弹窗
window.alert('消息')
window.confirm('确认?')   // 返回 true/false
window.prompt('输入:')      // 返回输入值

// 定时器
let timer = setTimeout(fn, 1000)      // 一次性
clearTimeout(timer)

let interval = setInterval(fn, 1000)  // 周期性
clearInterval(interval)
```

### location 对象

```javascript
location.href         // 完整 URL
location.protocol     // 协议 (http:)
location.hostname     // 主机名
location.port         // 端口
location.pathname     // 路径
location.search       // 查询参数
location.hash         // 锚点

// 方法
location.assign('url')      // 跳转
location.replace('url')    // 替换（无历史）
location.reload()          // 刷新
```

### navigator 对象

```javascript
navigator.userAgent        // 用户代理字符串
navigator.appName          // 浏览器名称
navigator.appVersion       // 版本
navigator.platform         // 操作系统
navigator.language         // 语言
navigator.onLine           // 是否在线
```

### history 对象

```javascript
history.back()             // 后退
history.forward()          // 前进
history.go(-1)             // 跳转（-1后退，1前进）
history.length             // 历史记录数

// HTML5 History API
history.pushState(state, title, url)      // 添加历史
history.replaceState(state, title, url)   // 替换当前
window.onpopstate = (e) => {}             // 监听返回
```

### screen 对象

```javascript
screen.width          // 屏幕宽度
screen.height         // 屏幕高度
screen.availWidth     // 可用宽度
screen.availHeight    // 可用高度
screen.colorDepth     // 颜色深度
```

## 盒模型

### CSS 盒模型

```
┌─────────────────────────────────┐
│            margin                │
│  ┌───────────────────────────┐  │
│  │          border            │  │
│  │  ┌─────────────────────┐  │  │
│  │  │       padding        │  │  │
│  │  │  ┌─────────────────┐ │  │  │
│  │  │  │     content      │ │  │  │
│  │  │  └─────────────────┘ │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### box-sizing

```css
/* content-box: width = content */
.content-box {
    box-sizing: content-box;
    width: 200px;  /* 内容200px */
}

/* border-box: width = content + padding + border */
.border-box {
    box-sizing: border-box;
    width: 200px;  /* 总宽度200px */
}
```

### JS 获取尺寸

```javascript
const box = document.getElementById('box')

// content + padding + border
box.offsetWidth
box.offsetHeight

// content + padding
box.clientWidth
box.clientHeight

// content
box.scrollWidth
box.scrollHeight

// margin
getComputedStyle(box).margin
```

## 事件模型

### 事件流

1. **捕获阶段**：从根节点到目标节点
2. **目标阶段**：到达目标元素
3. **冒泡阶段**：从目标节点到根节点

```javascript
element.addEventListener('click', handler, true)   // 捕获
element.addEventListener('click', handler, false)  // 冒泡（默认）
```

### 事件委托

```javascript
// 在父元素上监听子元素事件
document.querySelector('ul').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        console.log('点击了:', e.target.textContent)
    }
})
```

### 阻止默认行为

```javascript
element.addEventListener('click', (e) => {
    e.preventDefault()        // 阻止默认行为
    e.stopPropagation()        // 阻止冒泡
    e.stopImmediatePropagation() // 阻止后续事件
})
```

## 动画

### requestAnimationFrame

```javascript
function animate() {
    element.style.left = `${pos}px`
    pos += 5

    if (pos < 500) {
        requestAnimationFrame(animate)
    }
}

requestAnimationFrame(animate)
```

### 完整动画示例

```javascript
function animate(element, targetPosition, duration) {
    const startTime = performance.now()
    const startPosition = element.offsetLeft

    function step(currentTime) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        const currentPosition = startPosition + (targetPosition - startPosition) * easeProgress
        element.style.left = `${currentPosition}px`

        if (progress < 1) {
            requestAnimationFrame(step)
        }
    }

    requestAnimationFrame(step)
}

// 使用
animate(document.getElementById('box'), 500, 1000)
```

## 小结

- **DOM**：文档对象模型，操作 HTML 元素
- **BOM**：浏览器对象模型，操作浏览器功能
- **window**：全局对象，包含 document、location、navigator、history、screen
- **盒模型**：content → padding → border → margin
- **事件模型**：捕获 → 目标 → 冒泡
- **动画**：`requestAnimationFrame` 实现流畅动画
