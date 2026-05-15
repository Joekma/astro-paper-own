---
title: Astro 入门指南：核心概念与项目结构
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: astro-getting-started
description: '详细介绍Astro框架的核心概念、架构特点、项目结构和使用方法。'
tags:
  - Astro
  - 前端框架
  - 静态站点
  - SSG
draft: false
series: Astro
language: zh-CN
---

## 概述

Astro 是一个现代化的静态站点生成器（SSG）框架，专注于**内容驱动的网站**开发。它独特的**岛屿架构**（Islands Architecture）能够在保持高性能的同时，提供丰富的交互能力。Astro 支持多种 UI 框架（React、Vue、Svelte 等），但默认只发送 JavaScript，减少不必要的客户端代码。

### Astro 的核心特点

| 特性 | 说明 |
|------|------|
| **岛屿架构** | 只水合必要的交互组件 |
| **零 JS 默认** | 默认不发送 JavaScript |
| **内容集合** | 内置 Markdown/MDX 支持 |
| **多框架支持** | React、Vue、Svelte 混用 |
| **构建优化** | 自动代码分割和懒加载 |
| **类型安全** | 内置 TypeScript 支持 |

### Astro vs 其他框架

| 框架 | 优点 | 缺点 |
|------|------|------|
| **Astro** | 性能极佳、SEO 友好 | 交互组件需额外配置 |
| **Next.js** | 功能强大、生态丰富 | JS 较多 |
| **Nuxt** | Vue 生态 | 包体积较大 |
| **Gatsby** | 插件丰富 | 配置复杂 |

## 核心概念

### 岛屿架构

岛屿架构是 Astro 的核心理念：

```
┌─────────────────────────────────────────────────────────────┐
│                    Islands Architecture                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │              HTML 静态内容                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │ Header  │  │  导航    │  │  页脚    │       │   │
│  │  │  静态    │  │  静态    │  │  静态    │       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │              Islands（交互组件）                         │   │
│  │  ┌──────────┐  ┌──────────┐                         │   │
│  │  │  搜索框  │  │  评论组件 │                         │   │
│  │  │ React 组件│  │ Vue 组件 │                         │   │
│  │  └──────────┘  └──────────┘                         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 前端组件（Frontmatter）

Astro 组件使用 Frontmatter 传递数据：

```astro
---
// Frontmatter（JavaScript/TypeScript）
const title = "我的博客";
const posts = await fetch('/api/posts').then(r => r.json());
---

<html>
  <head><title>{title}</title></head>
  <body>
    <h1>{title}</h1>
    {posts.map(post => <PostCard post={post} />)}
  </body>
</html>
```

## 项目结构

### 目录结构

```
my-blog/
├── public/                  # 静态资源（直接复制到输出目录）
│   ├── favicon.ico
│   └── images/
│       └── logo.png
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── Card.astro
│   ├── layouts/             # 页面布局
│   │   └── BaseLayout.astro
│   ├── pages/              # 路由页面（基于文件）
│   │   ├── index.astro
│   │   ├── about.astro
│   │   └── blog/
│   │       ├── index.astro
│   │       └── [slug].astro
│   └── styles/              # 全局样式
│       └── global.css
├── astro.config.mjs        # 配置文件
├── package.json
└── tsconfig.json           # TypeScript 配置
```

### 路由约定

Astro 使用基于文件的路由：

```astro
# 文件路径 → URL 路由
# ========================================
# src/pages/index.astro    → /
# src/pages/about.astro     → /about
# src/pages/blog/index.astro → /blog
# src/pages/blog/[slug].astro → /blog/:slug
# src/pages/[...page].astro  → /* 捕获所有路由
```

## 基本组件

### Astro 组件

```astro
---
// src/components/Welcome.astro
const name = "Astro";
const items = ["组件1", "组件2", "组件3"];
---

<div class="welcome">
  <h1>欢迎来到 {name}！</h1>
  <ul>
    {items.map(item => <li>{item}</li>)}
  </ul>
</div>

<style>
  .welcome {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
    border-radius: 1rem;
  }
  
  h1 {
    color: white;
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  ul {
    list-style: none;
    padding: 0;
  }
  
  li {
    color: rgba(255, 255, 255, 0.9);
    padding: 0.5rem;
  }
</style>
```

### 使用组件

```astro
---
import Welcome from '../components/Welcome.astro';
import Header from '../components/Header.astro';
---

<html>
  <head>
    <title>我的网站</title>
  </head>
  <body>
    <Header />
    <Welcome />
  </body>
</html>
```

## 布局系统

### 创建布局

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description?: string;
}

const { title, description = "默认描述" } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 使用布局

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="关于我们" description="关于我们的介绍">
  <main>
    <h1>关于我们</h1>
    <p>这是页面内容</p>
  </main>
</BaseLayout>
```

## 内容集合

### 定义集合

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

### 创建内容

```markdown
---
# src/content/blog/hello-world.md
---
title: "Hello World"
description: "我的第一篇博客文章"
pubDate: 2024-01-01
tags: ["astro", "入门"]
---

# Hello World

这是博客内容...
```

### 查询内容

```astro
---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');

// 按日期排序
posts.sort((a, b) => 
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);

// 过滤文章
const techPosts = posts.filter(post => 
  post.data.tags.includes('astro')
);
---

<ul>
  {posts.map(post => (
    <li>
      <a href={`/blog/${post.slug}`}>
        {post.data.title}
      </a>
    </li>
  ))}
</ul>
```

## 静态生成

### SSG 模式

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  // 静态构建时为每篇文章生成一个路由。
  const posts = await getCollection('blog');

  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---

<h1>{post.data.title}</h1>
```

### 动态路由

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---

<h1>{post.data.title}</h1>
<Content content={post.body} />
```

## 样式处理

### Scoped CSS

```astro
<style>
  /* 只影响当前组件 */
  .card {
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
```

### 全局样式

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #3b82f6;
}

body {
  font-family: system-ui, sans-serif;
}
```

### Tailwind 集成

```bash
npx astro add tailwind
```

```astro
<div class="p-4 bg-white rounded-lg shadow">
  <h2 class="text-xl font-bold">标题</h2>
</div>
```

## 数据获取

### fetch API

```astro
---
const response = await fetch('https://api.example.com/data');
const data = await response.json();
---

<h1>{data.title}</h1>
```

### CMS 集成

```astro
---
import { Client } from '@astro-cms/sdk';

const client = new Client();
const posts = await client.getAllPosts();
---

{posts.map(post => (
  <article>
    <h2>{post.title}</h2>
  </article>
))}
```

## 构建和部署

### 构建命令

```bash
# 开发服务器
npm run dev

# 构建静态站点
npm run build

# 预览构建结果
npm run preview

# 类型检查
npm run check
```

### 部署配置

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://example.com',
  output: 'static', // 或 'server'（SSR）
});
```

## 最佳实践

### 性能优化

```astro
---
// 使用 Image 组件优化图片
import { Image } from 'astro:assets';
---

<Image 
  src={myImage} 
  alt="描述"
  width={800}
  height={600}
/>
```

### SEO 优化

```astro
---
const SEO = ({ title, description }) => (
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={Astro.url} />
    <meta property="og:title" content={title} />
  </head>
);
```

### 组件懒加载

```astro
---
// 使用 client:load 立即加载
// 使用 client:visible 视口加载
// 使用 client:idle 空闲时加载
---

<HeavyComponent client:visible />
<InteractiveWidget client:idle />
```
