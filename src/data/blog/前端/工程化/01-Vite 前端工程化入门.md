---
title: Vite 前端工程化入门
author: Joekma
pubDatetime: 2026-05-15T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: vite-frontend-engineering-getting-started
description: '介绍 Vite 的开发服务器、构建配置、环境变量、路径别名和常见插件配置。'
tags:
  - Vite
  - 工程化
  - 前端
  - 构建工具
draft: false
series: 前端工程化
language: zh-CN
---

Vite 是现代前端项目常用的构建工具。开发阶段依赖浏览器原生 ESM 和快速预构建，生产阶段使用 Rollup 打包。

## 创建项目

```bash
npm create vite@latest my-app
cd my-app
npm install
npm run dev
```

## 基础配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // React 项目启用 JSX、Fast Refresh 等能力。
    react(),
  ],
  server: {
    port: 5173,
    open: true,
  },
})
```

## 路径别名

```javascript
// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

```javascript
// 使用别名后，导入路径更稳定。
import { formatDate } from '@/utils/date'
```

## 环境变量

Vite 默认只暴露 `VITE_` 前缀的环境变量给浏览器端代码。

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000
```

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

// 不要把服务端密钥写进 VITE_ 变量。
fetch(`${apiBaseUrl}/posts`)
```

## 代理配置

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

## 构建优化

```javascript
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

## 小结

Vite 的价值不只是“启动快”，还包括清晰的插件系统、环境变量约束、开发代理和生产构建能力。掌握这些基础配置，就能覆盖大多数前端项目的工程化需求。
