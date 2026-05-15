---
title: React 深入浅出：组件、JSX 与 Props
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-components-jsx-props
description: "基于 React 官方文档，深入讲解组件拆分、JSX 规则、Props 传参和 children 组合模式。"
tags:
  - React
  - JSX
  - Props
  - 组件
  - 官方文档
draft: false
series: React 深入浅出
language: zh-CN
---

## 概述

React 官方文档把“描述 UI”作为学习 React 的第一大章节。原因很简单：React 开发首先不是操作页面，而是用组件表达页面结构。

官方文档参考：

- https://react.dev/learn/describing-the-ui
- https://react.dev/learn/your-first-component
- https://react.dev/learn/writing-markup-with-jsx
- https://react.dev/learn/passing-props-to-a-component

## 组件是什么

组件是 React 应用的基本单元。一个组件可以表示按钮、头像、导航栏，也可以表示完整页面。

```jsx
// 示例：组件是什么
function Avatar() {
  return <img src="/avatar.png" alt="用户头像" />;
}
```

组件可以嵌套使用：

```jsx
// 示例：组件是什么
function Profile() {
  return (
    <section>
      <Avatar />
      <h2>Joekma</h2>
    </section>
  );
}
```

## 组件拆分原则

React 官方 Thinking in React 中建议，可以从设计稿、数据结构和职责边界拆分组件。

| 原则     | 说明                             |
| -------- | -------------------------------- |
| 单一职责 | 一个组件尽量只做一件事           |
| 数据对应 | 数据模型的一部分通常对应一个组件 |
| 可复用   | 多处重复 UI 适合抽成组件         |
| 可维护   | JSX 太长或层级太深时考虑拆分     |

## JSX 规则

JSX 看起来像 HTML，但更严格。

### 返回一个根节点

```jsx
// 示例：返回一个根节点
function Article() {
  return (
    <>
      <h1>标题</h1>
      <p>正文</p>
    </>
  );
}
```

`<>...</>` 是 Fragment，不会生成额外 DOM。

### 标签必须闭合

```jsx
// 示例：标签必须闭合
function Logo() {
  return <img src="/logo.png" alt="Logo" />;
}
```

### 属性使用驼峰命名

```jsx
// 示例：属性使用驼峰命名
function Input() {
  return <input className="field" autoFocus />;
}
```

## JSX 中使用 JavaScript

JSX 使用 `{}` 插入 JavaScript 表达式。

```jsx
// 示例：JSX 中使用 JavaScript
const title = "React 深入浅出";

function Header() {
  return <h1>{title}</h1>;
}
```

动态属性也使用 `{}`：

```jsx
// 示例：JSX 中使用 JavaScript
function Avatar({ user }) {
  return <img src={user.avatar} alt={user.name} />;
}
```

内联样式使用对象：

```jsx
// 示例：JSX 中使用 JavaScript
function Box() {
  return <div style={{ padding: 16, backgroundColor: "#f5f5f5" }}>内容</div>;
}
```

## Props

Props 是父组件传给子组件的数据，类似函数参数。

```jsx
// 示例：Props
function Welcome({ name }) {
  return <h1>你好，{name}</h1>;
}

function App() {
  return <Welcome name="Joekma" />;
}
```

Props 可以传递任何 JavaScript 值：

| 类型   | 示例                               |
| ------ | ---------------------------------- |
| 字符串 | `<Avatar name="Ada" />`            |
| 数字   | `<Avatar size={100} />`            |
| 布尔值 | `<Button disabled={true} />`       |
| 对象   | `<Profile user={user} />`          |
| 数组   | `<List items={items} />`           |
| 函数   | `<Button onClick={handleClick} />` |
| JSX    | `<Layout header={<Header />} />`   |

## Props 是只读的

子组件不能修改 props。Props 是父组件传入的只读输入。

```jsx
// 示例：Props 是只读的
function Counter({ count, onIncrement }) {
  return <button onClick={onIncrement}>{count}</button>;
}
```

如果子组件需要改变数据，应调用父组件传入的回调函数。

## children 组合模式

`children` 表示组件标签中间的内容。

```jsx
// 示例：children 组合模式
function Card({ children }) {
  return <div className="card">{children}</div>;
}

function App() {
  return (
    <Card>
      <h2>标题</h2>
      <p>内容</p>
    </Card>
  );
}
```

这种模式适合封装卡片、弹窗、布局容器等组件。

## 保持组件纯粹

React 官方强调组件应保持纯粹：相同输入应返回相同输出，不应修改外部变量。

不推荐：

```jsx
// 示例：保持组件纯粹
let count = 0;

function Cup() {
  count = count + 1;
  return <h2>第 {count} 个杯子</h2>;
}
```

推荐：

```jsx
// 示例：保持组件纯粹
function Cup({ index }) {
  return <h2>第 {index} 个杯子</h2>;
}
```

## 小结

组件、JSX 和 Props 是 React 的第一块基石：

- 组件用于拆分 UI。
- JSX 用于描述 UI。
- Props 用于从父组件向子组件传递数据。
- children 提供组合能力。
- 组件保持纯粹可以减少难以定位的 Bug。
