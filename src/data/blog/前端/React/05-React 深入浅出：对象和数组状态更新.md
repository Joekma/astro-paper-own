---
title: React 深入浅出：对象和数组状态更新
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-updating-objects-arrays-in-state
description: "基于 React 官方文档，讲解为什么 state 应视为只读，以及如何安全更新对象、嵌套对象和数组。"
tags:
  - React
  - State
  - 不可变更新
  - 数组
  - 官方文档
draft: false
series: React 深入浅出
language: zh-CN
---

## 概述

React state 可以保存对象和数组，但官方文档强调：应该把 state 视为只读，不要直接修改已有对象或数组。

官方文档参考：

- https://react.dev/learn/updating-objects-in-state
- https://react.dev/learn/updating-arrays-in-state

## 为什么不能直接修改

错误示例：

```jsx
// 示例：为什么不能直接修改
function Profile() {
  const [person, setPerson] = useState({ name: "Ada" });

  function handleClick() {
    person.name = "Grace";
  }

  return <button onClick={handleClick}>{person.name}</button>;
}
```

这里直接修改了对象，但没有调用 `setPerson`，React 不会重新渲染。即使调用 setter，如果继续复用旧引用，也会让状态快照和调试变复杂。

## 更新对象

正确方式是创建新对象。

```jsx
// 示例：更新对象
function Profile() {
  const [person, setPerson] = useState({
    name: "Ada",
    city: "London",
  });

  function handleNameChange(event) {
    setPerson({
      ...person,
      name: event.target.value,
    });
  }

  return <input value={person.name} onChange={handleNameChange} />;
}
```

`...person` 复制旧字段，再覆盖需要更新的字段。

## 动态更新字段

```jsx
// 示例：动态更新字段
function UserForm() {
  const [user, setUser] = useState({ name: "", email: "" });

  function handleChange(event) {
    setUser({
      ...user,
      [event.target.name]: event.target.value,
    });
  }

  return (
    <form>
      <input name="name" value={user.name} onChange={handleChange} />
      <input name="email" value={user.email} onChange={handleChange} />
    </form>
  );
}
```

## 更新嵌套对象

嵌套对象需要逐层复制。

```jsx
// 示例：更新嵌套对象
function ArtworkForm() {
  const [person, setPerson] = useState({
    name: "Niki",
    artwork: {
      title: "Blue Nana",
      city: "Hamburg",
    },
  });

  function handleCityChange(event) {
    setPerson({
      ...person,
      artwork: {
        ...person.artwork,
        city: event.target.value,
      },
    });
  }

  return <input value={person.artwork.city} onChange={handleCityChange} />;
}
```

如果状态结构太深，官方建议考虑扁平化数据结构。

## 更新数组：添加

```jsx
// 示例：更新数组：添加
function addTodo(text) {
  setTodos([...todos, { id: crypto.randomUUID(), text, done: false }]);
}
```

不要直接 `push`，因为 `push` 会修改原数组。

## 更新数组：删除

```jsx
// 示例：更新数组：删除
function deleteTodo(id) {
  setTodos(todos.filter(todo => todo.id !== id));
}
```

`filter()` 返回新数组。

## 更新数组：修改

```jsx
// 示例：更新数组：修改
function toggleTodo(id) {
  setTodos(
    todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, done: !todo.done };
      }

      return todo;
    })
  );
}
```

只为被修改的项创建新对象，未修改项可以返回原对象。

## 更新数组：排序

`sort()` 会修改原数组，需要先复制。

```jsx
// 示例：更新数组：排序
function sortTodos() {
  const nextTodos = [...todos];
  nextTodos.sort((a, b) => a.text.localeCompare(b.text));
  setTodos(nextTodos);
}
```

## 常见操作对照

| 目标 | 避免             | 推荐             |
| ---- | ---------------- | ---------------- |
| 添加 | `push`           | `[...arr, item]` |
| 删除 | `splice`         | `filter`         |
| 替换 | `arr[i] = value` | `map`            |
| 排序 | 直接 `sort`      | 复制后 `sort`    |
| 反转 | 直接 `reverse`   | 复制后 `reverse` |

## 使用更新函数

如果下一份 state 依赖上一份 state，推荐使用更新函数。

```jsx
// 示例：使用更新函数
function addTodo(text) {
  setTodos(currentTodos => [
    ...currentTodos,
    { id: crypto.randomUUID(), text, done: false },
  ]);
}
```

## 小结

对象和数组状态更新的核心是不可变：

- 不直接修改 state。
- 更新对象时创建新对象。
- 更新嵌套对象时逐层复制。
- 添加数组项使用展开语法。
- 删除数组项使用 `filter()`。
- 修改数组项使用 `map()`。
- 排序和反转前先复制数组。
