---
title: React 深入浅出：路由、表单与数据请求
author: Joekma
pubDatetime: 2026-05-15T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: react-routing-forms-data-fetching
description: '补充 React 实战常见能力：前端路由、受控表单、请求状态、AbortController 和服务端状态边界。'
tags:
  - React
  - React Router
  - 表单
  - 数据请求
  - 前端框架
draft: false
series: React 深入浅出
language: zh-CN
---

前面几篇文章已经覆盖组件、状态、Effect、Reducer 和 Context。真实项目还会遇到三个高频问题：页面如何切换、表单如何组织、数据如何请求。

## 路由职责

React 本身不内置路由。单页应用通常使用 React Router；Next.js、Remix、Astro 等框架则会提供自己的路由系统。

```jsx
// 示例：React Router 的基础路由结构。
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/posts/:id', element: <PostDetailPage /> },
  { path: '/settings', element: <SettingsPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

## URL 参数

```jsx
// 示例：从路由参数中读取文章 id。
import { useParams } from 'react-router-dom';

export function PostDetailPage() {
  const { id } = useParams();

  return <h1>文章 ID：{id}</h1>;
}
```

## 受控表单

受控表单把输入值放进 React state，优点是验证、联动和提交逻辑都更清晰。

```jsx
// 示例：登录表单的受控状态。
import { useState } from 'react';

export function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });

  function updateField(event) {
    const { name, value } = event.target;
    setForm(current => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.log('提交表单', form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" value={form.email} onChange={updateField} />
      <input name="password" type="password" value={form.password} onChange={updateField} />
      <button type="submit">登录</button>
    </form>
  );
}
```

## 请求状态

请求通常至少有四种状态：未开始、加载中、成功、失败。把它们显式建模，组件会更容易维护。

```jsx
// 示例：Effect 中请求数据并处理取消。
import { useEffect, useState } from 'react';

export function UserProfile({ userId }) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setState({ status: 'loading', data: null, error: null });

      try {
        const response = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('请求失败');
        const data = await response.json();
        setState({ status: 'success', data, error: null });
      } catch (error) {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', data: null, error });
        }
      }
    }

    loadUser();

    return () => controller.abort();
  }, [userId]);

  if (state.status === 'loading') return <p>加载中...</p>;
  if (state.status === 'error') return <p>加载失败：{state.error.message}</p>;
  if (!state.data) return null;

  return <h1>{state.data.name}</h1>;
}
```

## 服务端状态

接口数据不是普通 UI state。它有缓存、重新验证、并发请求、分页和失败重试等问题。项目复杂后，可以引入 TanStack Query、SWR，或使用框架自带的数据加载能力。

```jsx
// 示例：把“服务端状态”交给专门工具管理。
import { useQuery } from '@tanstack/react-query';

function useUser(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('请求失败');
      return response.json();
    },
  });
}
```

## 小结

路由解决页面和 URL 的映射，表单解决用户输入，数据请求解决外部系统同步。简单项目可以手写状态；复杂项目要尽早区分 UI state 和服务端状态，避免把缓存、重试和并发逻辑散落在组件里。
