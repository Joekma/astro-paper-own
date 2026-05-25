---
title: React 深入浅出：Ref、Effect 与外部系统同步
author: Joekma
pubDatetime: 2026-05-12T00:00:00.000+08:00
modDatetime: 2026-05-12T00:00:00.000+08:00
slug: react-deep-dive-ref-effect
description: "基于 React 官方文档，讲解 useRef、DOM 访问、useEffect、Effect 清理、依赖管理以及为什么很多场景不需要 Effect。"
tags:
  - React
  - useRef
  - useEffect
  - Hooks
  - 官方文档
draft: false
series: React 深入浅出
seriesOrder: 7
language: zh-CN
---

## 概述

React 官方文档把 Ref 和 Effect 称为 Escape Hatches，也就是“逃生舱口”。它们用于处理 React 常规数据流之外的事情。

官方文档参考：

- https://react.dev/learn/escape-hatches
- https://react.dev/learn/referencing-values-with-refs
- https://react.dev/learn/manipulating-the-dom-with-refs
- https://react.dev/learn/synchronizing-with-effects
- https://react.dev/learn/you-might-not-need-an-effect
- https://react.dev/learn/removing-effect-dependencies

## Ref 是什么

`useRef` 可以让组件在多次渲染之间记住一个值，但修改它不会触发重新渲染。

```jsx
// 示例：Ref 是什么
import { useRef } from "react";

function Counter() {
  const countRef = useRef(0);

  function handleClick() {
    countRef.current = countRef.current + 1;
    alert("点击次数：" + countRef.current);
  }

  return <button onClick={handleClick}>点击</button>;
}
```

## Ref 与 State

| 对比           | State              | Ref                           |
| -------------- | ------------------ | ----------------------------- |
| 修改后重新渲染 | 是                 | 否                            |
| 渲染之间保留   | 是                 | 是                            |
| 适合显示在 UI  | 是                 | 否                            |
| 常见用途       | 表单值、开关、列表 | DOM 节点、定时器 ID、外部对象 |

如果一个值会影响渲染结果，用 state。如果只需要记住但不展示，用 ref。

## 操作 DOM

```jsx
// 示例：操作 DOM
import { useRef } from "react";

function SearchForm() {
  const inputRef = useRef(null);

  function handleFocus() {
    inputRef.current.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleFocus}>聚焦输入框</button>
    </>
  );
}
```

React 会把真实 DOM 节点赋值给 `inputRef.current`。

## Effect 是什么

Effect 用于让组件和 React 外部系统同步。外部系统包括浏览器 API、网络连接、第三方插件、定时器、媒体对象等。

```jsx
// 示例：Effect 是什么
import { useEffect, useRef } from "react";

function VideoPlayer({ isPlaying }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  return <video ref={videoRef} src="/video.mp4" />;
}
```

这里 React 状态 `isPlaying` 需要同步到浏览器视频播放器，所以使用 Effect。

## Effect 清理

如果 Effect 建立订阅、连接、定时器等资源，应该返回清理函数。

```jsx
// 示例：Effect 清理
useEffect(() => {
  const id = setInterval(() => {
    console.log("tick");
  }, 1000);

  return () => clearInterval(id);
}, []);
```

清理函数会在组件卸载前执行，也会在依赖变化导致 Effect 重新运行前执行。

## 你可能不需要 Effect

官方文档强调，很多 Effect 可以删除。

不推荐用 Effect 计算派生数据：

```jsx
// 示例：你可能不需要 Effect
function Form({ firstName, lastName }) {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(firstName + " " + lastName);
  }, [firstName, lastName]);

  return <p>{fullName}</p>;
}
```

推荐在渲染期间计算：

```jsx
// 示例：你可能不需要 Effect
function Form({ firstName, lastName }) {
  const fullName = firstName + " " + lastName;
  return <p>{fullName}</p>;
}
```

## Effect 依赖

Effect 依赖数组描述了 Effect 使用的响应式值。

```jsx
// 示例：Effect 依赖
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

不要为了让 Effect 少运行就随意删除依赖。应该调整代码结构，让某些依赖变得不再需要。

## 减少不必要依赖

不推荐：

```jsx
// 示例：减少不必要依赖
function ChatRoom({ roomId }) {
  const options = { roomId };

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]);
}
```

推荐：

```jsx
// 示例：减少不必要依赖
function ChatRoom({ roomId }) {
  useEffect(() => {
    const options = { roomId };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
}
```

## 小结

Ref 和 Effect 很强，但要谨慎：

- Ref 保存不影响渲染的值或 DOM 节点。
- State 保存影响 UI 的数据。
- Effect 用于同步外部系统。
- 能在渲染期间计算的内容不要放 Effect。
- 能在事件中完成的逻辑不要放 Effect。
- Effect 建立资源时要清理。
