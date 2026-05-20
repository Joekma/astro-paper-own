---
title: React 深入浅出：状态管理、Reducer 与 Context
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-managing-state-reducer-context
description: "基于 React 官方文档，讲解状态结构设计、状态提升、useReducer、Context 以及组合使用方式。"
tags:
  - React
  - useReducer
  - Context
  - 状态管理
  - 官方文档
draft: false
series: React 深入浅出
seriesOrder: 6
language: zh-CN
---

## 概述

当应用变复杂时，关键问题不只是如何更新状态，而是状态应该放在哪里、如何设计形状、如何在组件间传递。

官方文档参考：

- https://react.dev/learn/managing-state
- https://react.dev/learn/choosing-the-state-structure
- https://react.dev/learn/sharing-state-between-components
- https://react.dev/learn/extracting-state-logic-into-a-reducer
- https://react.dev/learn/passing-data-deeply-with-context
- https://react.dev/learn/scaling-up-with-reducer-and-context

## 用状态驱动 UI

React 推荐描述不同状态下的 UI，而不是命令式地操作 UI。

```jsx
// 示例：用状态驱动 UI
function Form() {
  const [status, setStatus] = useState("typing");

  if (status === "success") {
    return <h1>提交成功</h1>;
  }

  return (
    <form>
      <textarea disabled={status === "submitting"} />
      <button disabled={status === "submitting"}>提交</button>
    </form>
  );
}
```

## 状态结构原则

官方建议：

| 原则         | 说明                          |
| ------------ | ----------------------------- |
| 合并相关状态 | 总是一起变化的数据可以合并    |
| 避免矛盾状态 | 不要让 state 组合出不可能情况 |
| 避免冗余状态 | 能计算出来就不要存            |
| 避免重复状态 | 同一数据不要存两份            |
| 避免深层嵌套 | 深层更新困难                  |

## 避免冗余状态

不推荐：

```jsx
// 示例：避免冗余状态
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [fullName, setFullName] = useState("");
```

推荐：

```jsx
// 示例：避免冗余状态
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const fullName = firstName + " " + lastName;
```

`fullName` 可以计算出来，不需要单独存 state。

## 状态提升

多个组件需要共享状态时，把状态移动到最近的共同父组件。

```jsx
// 示例：状态提升
function Accordion() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <Panel
        isActive={activeIndex === 0}
        onShow={() => setActiveIndex(0)}
        title="简介"
      />
      <Panel
        isActive={activeIndex === 1}
        onShow={() => setActiveIndex(1)}
        title="详情"
      />
    </>
  );
}

function Panel({ title, isActive, onShow }) {
  return (
    <section>
      <h2>{title}</h2>
      {isActive ? <p>面板内容</p> : <button onClick={onShow}>展开</button>}
    </section>
  );
}
```

## 使用 key 重置状态

React 会根据组件在树中的位置保留状态。如果希望切换数据时重置组件，可以使用不同的 `key`。

```jsx
// 示例：使用 key 重置状态
function Messenger({ contact }) {
  return <Chat key={contact.email} contact={contact} />;
}
```

当 `contact.email` 变化时，`Chat` 会被视为新组件，内部 state 会重置。

## useReducer

当状态更新逻辑复杂时，可以使用 `useReducer`。

```jsx
// 示例：useReducer
function tasksReducer(tasks, action) {
  switch (action.type) {
    case "added": {
      return [...tasks, { id: action.id, text: action.text, done: false }];
    }
    case "deleted": {
      return tasks.filter(task => task.id !== action.id);
    }
    default: {
      throw Error("未知 action: " + action.type);
    }
  }
}

function TaskApp() {
  const [tasks, dispatch] = useReducer(tasksReducer, []);

  function handleAddTask(text) {
    dispatch({ type: "added", id: crypto.randomUUID(), text });
  }
}
```

Reducer 把“发生了什么”和“如何更新状态”分离。

## Context

Context 用于跨层级传递数据，避免层层传 props。

```jsx
// 示例：Context
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
  );
}

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>按钮</button>;
}
```

适合放主题、语言、当前用户、权限等跨层级数据。

## Reducer 与 Context 组合

复杂页面可以组合 reducer 和 context：

```jsx
// 示例：Reducer 与 Context 组合
const TasksContext = createContext(null);
const TasksDispatchContext = createContext(null);

function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(tasksReducer, []);

  return (
    <TasksContext.Provider value={tasks}>
      <TasksDispatchContext.Provider value={dispatch}>
        {children}
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  );
}
```

下层组件既能读取任务，也能派发更新，不需要层层传递。

## 小结

React 状态管理的关键是设计：

- 能计算出来的数据不要存 state。
- 多组件共享状态时向上移动。
- 复杂更新逻辑使用 reducer。
- 深层传递数据使用 context。
- reducer 和 context 可以组合管理复杂页面。
