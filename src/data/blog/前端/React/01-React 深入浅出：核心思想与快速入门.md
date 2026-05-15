---
title: React 深入浅出：核心思想与快速入门
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-quick-start
description: "基于 React 官方文档，系统介绍 React 的核心思想、组件模型、JSX、事件、状态和数据流。"
tags:
  - React
  - 前端框架
  - JavaScript
  - 官方文档
draft: false
series: React 深入浅出
language: zh-CN
---

## 概述

React 是一个用于构建用户界面的 JavaScript 库。按照官方文档的说法，React 应用由组件组成，组件可以小到一个按钮，也可以大到一个完整页面。

官方文档参考：

- https://react.dev/learn
- https://react.dev/reference/react

React 的核心不是直接操作 DOM，而是用数据描述 UI。当数据变化时，React 会重新执行组件函数，计算新的 UI 描述，并把必要变化提交到浏览器。

```text
数据变化
  ↓
组件重新渲染
  ↓
生成新的 JSX
  ↓
React 更新 DOM
```

## 第一个组件

React 组件本质上是返回 JSX 的 JavaScript 函数。

```jsx
// 示例：第一个组件
function MyButton() {
  return <button>我是按钮</button>;
}

export default function App() {
  return (
    <div>
      <h1>欢迎学习 React</h1>
      <MyButton />
    </div>
  );
}
```

组件名称必须以大写字母开头。`<MyButton />` 是自定义组件，`<button>` 是浏览器内置标签。

## JSX 基础

JSX 是 JavaScript 的语法扩展，用来在 JavaScript 中描述 UI。

```jsx
// 示例：JSX 基础
function Profile() {
  return (
    <section>
      <h2>React 学习路线</h2>
      <p>从组件、状态、Effect 到工程实践。</p>
    </section>
  );
}
```

JSX 比 HTML 更严格：

| 规则               | 说明                            |
| ------------------ | ------------------------------- |
| 必须闭合标签       | `<img />`、`<input />` 都要闭合 |
| 只能返回一个根节点 | 可使用 `<>...</>` Fragment      |
| 使用 `className`   | 不能直接写 `class`              |
| 动态值使用 `{}`    | 如 `src={user.avatar}`          |

## 显示数据

JSX 中使用 `{}` 嵌入 JavaScript 表达式。

```jsx
// 示例：显示数据
const user = {
  name: "Ada Lovelace",
  avatar: "/avatar.png",
};

function UserCard() {
  return (
    <article>
      <h2>{user.name}</h2>
      <img src={user.avatar} alt={user.name} />
    </article>
  );
}
```

可以在 `{}` 中放变量、函数调用、三元表达式、数组映射结果等表达式。

## 条件渲染

React 使用 JavaScript 条件语句表达不同 UI。

```jsx
// 示例：条件渲染
function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <h1>欢迎回来</h1>;
  }

  return <h1>请先登录</h1>;
}
```

也可以使用三元表达式：

```jsx
// 示例：条件渲染
function Status({ online }) {
  return <p>{online ? "在线" : "离线"}</p>;
}
```

## 列表渲染

React 使用 `map()` 把数组转换成 JSX。

```jsx
// 示例：列表渲染
const products = [
  { id: 1, name: "苹果" },
  { id: 2, name: "香蕉" },
];

function ProductList() {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}
```

`key` 帮助 React 识别列表项，官方推荐使用数据中的稳定 ID。

## 事件处理

事件处理函数通常定义在组件内部，并传给 JSX 属性。

```jsx
// 示例：事件处理
function SaveButton() {
  function handleClick() {
    alert("保存成功");
  }

  return <button onClick={handleClick}>保存</button>;
}
```

注意 `onClick={handleClick}` 没有括号，它表示把函数交给 React，在点击时由 React 调用。

## State

组件需要记住会变化的数据时，使用 `useState`。

```jsx
// 示例：State
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>点击了 {count} 次</button>;
}
```

`useState` 返回当前状态和更新函数。调用更新函数后，React 会安排组件重新渲染。

## 共享数据

如果多个组件需要共享同一份状态，应把状态移动到它们最近的共同父组件。

```jsx
// 示例：共享数据
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Button count={count} onClick={() => setCount(count + 1)} />
      <Button count={count} onClick={() => setCount(count + 1)} />
    </>
  );
}

function Button({ count, onClick }) {
  return <button onClick={onClick}>{count}</button>;
}
```

这就是官方文档中的“状态提升”。

## 小结

React 入门应抓住几条主线：

- 用组件拆分 UI。
- 用 JSX 描述界面。
- 用 props 传递数据。
- 用 state 保存变化。
- 用事件触发状态更新。
- 用状态提升共享数据。

理解“UI 是状态的函数”，后续学习 Hooks、Effect、Reducer、Context 会轻松很多。
