---
title: Vue初识与指令
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: vue-introduction-and-directives
description: 'Vue.js入门，介绍Vue的基本概念、实例创建和常用指令'
tags:
  - Vue
  - 前端
  - JavaScript
  - 框架
category: 前端
draft: false
language: zh-CN
---

> Vue.js 是一个渐进式 JavaScript 框架，用于构建用户界面。

## Vue 简介

### 什么是 Vue

**Vue.js** 是一个渐进式 JavaScript 框架，可以轻松构建交互式用户界面。

### Vue 的特点

| 特点 | 说明 |
|------|------|
| **渐进式** | 可以从小到大，逐步引入 |
| **数据绑定** | 双向数据绑定，简化 DOM 操作 |
| **组件化** | 组件化开发，提高代码复用 |
| **虚拟 DOM** | 提高 DOM 操作效率 |

## Vue 基本使用

### 1. 引入 Vue

```html
<script src="https://cdn.jsdelivr.net/npm/vue@2"></script>
```

### 2. 创建 Vue 实例

```html
<div id="app">
    <h1>{{ message }}</h1>
</div>

<script>
    var app = new Vue({
        el: '#app',
        data: {
            message: 'Hello Vue!'
        }
    });
</script>
```

## Vue 实例选项

### el - 挂载点

```javascript
new Vue({
    el: '#app',      // 挂载点
    el: '.container',
    el: document.getElementById('app')
})
```

> **注意**：不要挂在到 `html` 或 `body` 上。

### data - 数据

```javascript
new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue',
        count: 0,
        user: { name: '张三', age: 25 },
        items: ['苹果', '香蕉', '橙子']
    }
})
```

### methods - 方法

```javascript
new Vue({
    el: '#app',
    data: {
        count: 0
    },
    methods: {
        addCount() {
            this.count++;
        },
        sayHello(name) {
            return `Hello, ${name}`;
        }
    }
})
```

### computed - 计算属性

```javascript
new Vue({
    el: '#app',
    data: {
        firstName: '张',
        lastName: '三'
    },
    computed: {
        fullName() {
            return this.firstName + this.lastName;
        }
    }
})
```

### watch - 侦听器

```javascript
new Vue({
    el: '#app',
    data: {
        question: ''
    },
    watch: {
        question(newVal, oldVal) {
            console.log(`问题从 ${oldVal} 变为 ${newVal}`);
        }
    }
})
```

## 常用指令

### v-text / v-html

```html
<!-- 纯文本 -->
<span v-text="message"></span>
<span>{{ message }}</span>

<!-- HTML -->
<div v-html="htmlContent"></div>
```

### v-model - 双向绑定

```html
<input v-model="message">

<!-- 修饰符 -->
<input v-model.number="age">      <!-- 自动转换为数字 -->
<input v-model.trim="username">   <!-- 去除首尾空格 -->
<input v-model.lazy="message">   <!-- 失去焦点时更新 -->
```

### v-show / v-if

```html
<!-- v-show: display 控制 -->
<div v-show="isShow">显示</div>

<!-- v-if: 条件渲染 -->
<div v-if="type === 'A'">A</div>
<div v-else-if="type === 'B'">B</div>
<div v-else>C</div>
```

### v-for - 循环

```html
<!-- 数组 -->
<ul>
    <li v-for="(item, index) in items" :key="index">
        {{ index }} - {{ item }}
    </li>
</ul>

<!-- 对象 -->
<div v-for="(value, key, index) in user" :key="key">
    {{ index }}. {{ key }}: {{ value }}
</div>
```

### v-on - 事件绑定

```html
<button v-on:click="handleClick">点击</button>
<button @click="handleClick">点击</button>

<!-- 传参 -->
<button @click="handleClick('arg1', $event)">点击</button>

<!-- 修饰符 -->
<button @click.stop="handleClick">阻止冒泡</button>
<button @click.prevent="handleSubmit">阻止默认行为</button>
<input @keyup.enter="handleEnter">回车键
```

### v-bind - 属性绑定

```html
<img v-bind:src="imageSrc">
<img :src="imageSrc">

<!-- 对象语法 -->
<div :class="{ active: isActive, 'text-danger': hasError }"></div>

<!-- 数组语法 -->
<div :class="[activeClass, errorClass]"></div>

<!-- 样式 -->
<div :style="{ color: textColor, fontSize: fontSize + 'px' }"></div>
```

## 条件渲染

### v-if vs v-show

| 特性 | v-if | v-show |
|------|------|--------|
| **原理** | DOM 操作 | display 控制 |
| **切换开销** | 高（重建 DOM） | 低（仅切换显示） |
| **初始开销** | 低（条件为 false 不渲染） | 高（始终渲染） |
| **适用场景** | 很少切换 | 频繁切换 |

## 事件处理

### 事件修饰符

| 修饰符 | 说明 |
|--------|------|
| `.stop` | 阻止冒泡 |
| `.prevent` | 阻止默认行为 |
| `.capture` | 使用捕获模式 |
| `.self` | 仅触发自身 |
| `.once` | 只触发一次 |

### 按键修饰符

```html
<input @keyup.enter="handleEnter">
<input @keyup.esc="handleEsc">
<input @keyup.up="handleUp">
<input @keyup.ctrl.enter="handleCtrlEnter">
```

## 小结

- **Vue 实例**：`el`、`data`、`methods`、`computed`、`watch`
- **指令**：`v-text`、`v-html`、`v-model`、`v-show`、`v-if`、`v-for`、`v-on`、`v-bind`
- **双向绑定**：`v-model` 实现表单输入与应用状态的双向绑定
- **条件渲染**：`v-if` vs `v-show`
- **列表渲染**：`v-for` with `:key`
