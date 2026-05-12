---
title: React 深入浅出：条件渲染、列表渲染与 Key
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-conditional-list-key
description: "基于 React 官方文档，讲解条件渲染、列表渲染、filter/map 和 key 的作用。"
tags:
  - React
  - 条件渲染
  - 列表渲染
  - Key
  - 官方文档
draft: false
series: React 深入浅出
language: zh-CN
---

## 概述

React 没有专门的模板指令。条件和列表都使用 JavaScript 本身表达。

官方文档参考：

- https://react.dev/learn/conditional-rendering
- https://react.dev/learn/rendering-lists

## 条件渲染

最直接的条件渲染方式是使用 `if`。

```jsx
function LoginStatus({ isLoggedIn }) {
  if (isLoggedIn) {
    return <p>已登录</p>;
  }

  return <p>未登录</p>;
}
```

也可以用变量保存 JSX：

```jsx
function Dashboard({ role }) {
  let content;

  if (role === "admin") {
    content = <AdminPanel />;
  } else {
    content = <UserPanel />;
  }

  return <main>{content}</main>;
}
```

## 三元表达式

适合二选一的简单场景。

```jsx
function Status({ online }) {
  return <p>{online ? "在线" : "离线"}</p>;
}
```

## 逻辑与运算符

只在条件满足时显示内容，可以使用 `&&`。

```jsx
function Notice({ count }) {
  return <div>{count > 0 && <p>你有 {count} 条新消息</p>}</div>;
}
```

建议左侧写成明确布尔表达式，避免 `0 && ...` 渲染出 `0`。

## 返回 null

组件可以返回 `null` 表示什么都不渲染。

```jsx
function Warning({ visible }) {
  if (!visible) {
    return null;
  }

  return <p>请注意风险</p>;
}
```

## 列表渲染

React 使用 `map()` 把数组转换成 JSX 数组。

```jsx
const users = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
];

function UserList() {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## filter 与 map

先筛选再渲染是常见模式。

```jsx
function OnlineUsers({ users }) {
  return (
    <ul>
      {users
        .filter(user => user.online)
        .map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
    </ul>
  );
}
```

## key 的作用

`key` 是 React 用来识别列表项身份的标记。当列表插入、删除、排序时，React 依靠 `key` 判断哪些元素可以复用。

推荐使用稳定 ID：

```jsx
items.map(item => <li key={item.id}>{item.name}</li>);
```

不推荐随机数：

```jsx
items.map(item => <li key={Math.random()}>{item.name}</li>);
```

随机 `key` 每次渲染都变化，会让 React 认为所有元素都是新的。

## 什么时候不要用索引作为 key

如果列表会排序、插入、删除，不推荐使用数组索引。

```jsx
items.map((item, index) => <li key={index}>{item.name}</li>);
```

因为位置变化后，同一个索引可能对应不同数据，容易导致状态错位。

## key 不会传给组件

`key` 是 React 内部使用的特殊属性，不会出现在 props 中。

```jsx
function Row({ id, name }) {
  return <li>{name}</li>;
}

function List({ users }) {
  return users.map(user => <Row key={user.id} id={user.id} name={user.name} />);
}
```

如果组件内部需要 ID，必须显式传入。

## 小结

条件渲染和列表渲染都依赖 JavaScript：

- `if` 适合复杂分支。
- 三元表达式适合二选一。
- `&&` 适合条件成立才展示。
- `map()` 用于列表渲染。
- `filter()` 可与 `map()` 组合。
- `key` 应稳定且来自数据本身。
