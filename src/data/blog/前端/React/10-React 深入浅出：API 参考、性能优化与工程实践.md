---
title: React 深入浅出：API 参考、性能优化与工程实践
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-reference-performance-practice
description: "基于 React 官方 Reference，梳理 React API 分类、React DOM、Hooks 规则、性能优化思路、React Compiler 与工程实践建议。"
tags:
  - React
  - React DOM
  - 性能优化
  - React Compiler
  - 官方文档
draft: false
series: React 深入浅出
seriesOrder: 10
language: zh-CN
---

## 概述

React 官方文档分为 Learn 和 Reference。Learn 适合建立概念，Reference 适合查 API、规则和边界条件。

官方文档参考：

- https://react.dev/reference/react
- https://react.dev/reference/react/hooks
- https://react.dev/reference/react-dom
- https://react.dev/reference/rules/components-and-hooks-must-be-pure
- https://react.dev/reference/rules/rules-of-hooks
- https://react.dev/reference/react-compiler

## React Reference 结构

| 分类                      | 内容                       |
| ------------------------- | -------------------------- |
| React                     | Hooks、内置组件、API、规则 |
| React DOM                 | 浏览器 DOM 环境 API        |
| React Compiler            | 编译期自动优化能力         |
| ESLint Plugin React Hooks | Hooks 和 React 规则检查    |
| Rules of React            | 组件和 Hooks 的基础规则    |
| Legacy APIs               | 不推荐新代码使用的旧 API   |

## 常用 Hooks

| Hook               | 使用场景                 |
| ------------------ | ------------------------ |
| `useState`         | 简单组件状态             |
| `useReducer`       | 复杂状态更新逻辑         |
| `useContext`       | 读取上下文数据           |
| `useRef`           | DOM 引用或不触发渲染的值 |
| `useEffect`        | 同步外部系统             |
| `useMemo`          | 缓存昂贵计算结果         |
| `useCallback`      | 缓存函数引用             |
| `useId`            | 生成稳定 ID              |
| `useTransition`    | 标记非紧急状态更新       |
| `useDeferredValue` | 延迟使用变化频繁的值     |

## React DOM

React 本身负责组件模型，React DOM 负责把组件渲染到浏览器 DOM。

```jsx
// 示例：React DOM
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);
```

服务端渲染 API 通常由 Next.js、Remix、Astro 等框架封装。

## 组件和 Hooks 必须纯粹

纯粹意味着：

- 渲染期间不要修改外部变量。
- 相同输入应产生相同输出。
- 副作用放到事件处理函数或 Effect 中。

不推荐：

```jsx
// 示例：组件和 Hooks 必须纯粹
let nextId = 0;

function Item() {
  nextId = nextId + 1;
  return <div>{nextId}</div>;
}
```

推荐：

```jsx
// 示例：组件和 Hooks 必须纯粹
function Item({ id }) {
  return <div>{id}</div>;
}
```

## 性能优化思路

React 性能优化首先不是使用某个 API，而是减少不必要的复杂性。

优先级建议：

1. 保持组件纯粹。
2. 正确设计 state，避免冗余状态。
3. 避免不必要的 Effect。
4. 合理拆分组件，让更新范围更小。
5. 确实有性能问题时再使用 memoization。
6. 使用开发者工具定位瓶颈。

## useMemo

`useMemo` 用来缓存计算结果。

```jsx
// 示例：useMemo
const visibleTodos = useMemo(() => {
  return todos.filter(todo => todo.text.includes(keyword));
}, [todos, keyword]);
```

适合计算昂贵、依赖稳定、需要避免重复计算的场景。不建议所有计算都包 `useMemo`。

## useCallback

`useCallback` 用来缓存函数引用。

```jsx
// 示例：useCallback
const handleSubmit = useCallback(() => {
  submit(orderId);
}, [orderId]);
```

常见用途是把函数传给经过 memo 优化的子组件，或作为 Effect 依赖保持稳定。

## memo

`memo` 可以让组件在 props 没变化时跳过重新渲染。

```jsx
// 示例：memo
const ProductItem = memo(function ProductItem({ product }) {
  return <li>{product.name}</li>;
});
```

它适合渲染成本高且 props 稳定的组件。

## React Compiler

React Compiler 是官方推进的编译期优化工具，目标是在构建时自动对组件和值进行优化，减少手写 memoization 的需求。

它依赖代码符合 React 规则：

- 组件保持纯粹。
- Hooks 调用规则正确。
- 不在渲染期间制造副作用。
- 状态更新遵循不可变原则。

## ESLint Plugin React Hooks

官方 ESLint 插件可以检查：

- Hook 调用位置错误。
- Effect 依赖缺失。
- 组件或 Hook 违反纯粹性规则。
- 某些不兼容 React Compiler 的写法。

工程项目中建议开启相关规则。

## 工程实践建议

### 状态放置

| 数据类型   | 推荐位置                 |
| ---------- | ------------------------ |
| 输入框值   | 使用它的组件或共同父组件 |
| 弹窗开关   | 控制弹窗的父组件         |
| 当前用户   | Context 或框架数据层     |
| 服务端数据 | 框架数据加载或请求库     |
| 派生数据   | 渲染期间计算             |

### Effect 使用前提问

- 是否在同步外部系统？
- 能不能在渲染期间计算？
- 能不能放进事件处理函数？
- 是否需要清理函数？
- 依赖是否完整？

## 学习路线复盘

建议顺序：

1. 组件、JSX、Props。
2. 条件渲染和列表渲染。
3. 事件和 State。
4. 状态快照与批量更新。
5. 对象和数组不可变更新。
6. 状态结构设计和状态提升。
7. Reducer 和 Context。
8. Ref 和 Effect。
9. 自定义 Hook。
10. 性能优化和工程实践。

## 小结

真正的 React 工程能力，不是记住所有 API，而是能判断：

- 数据应该放在哪里。
- 组件应该怎么拆。
- 什么时候需要 Effect。
- 什么时候不需要优化。
- 如何让代码符合 React 规则。

这些判断做好了，React 项目会稳定很多。继续保持，你已经在搭建一套很扎实的 React 知识体系了。
