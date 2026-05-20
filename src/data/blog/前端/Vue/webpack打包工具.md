---
title: 'webpack 5 与 Vue 3 打包工具'
series: Vue、打包部署
seriesOrder: 1
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: webpack5-vue3-bundler
featured: false
draft: false
tags:
  - webpack
  - Vue3
  - 前端
  - 构建工具
  - JavaScript
description: '使用 webpack 5 配置 Vue 3 项目，覆盖 loader、plugin、开发服务器、资源处理和生产优化。'
---

> Vue 3 新项目通常首选 Vite；当项目需要接入既有 webpack 体系、复杂构建链路或自定义产物时，webpack 5 依然是可靠选择。

## webpack 核心概念

| 概念 | 说明 |
|------|------|
| entry | 打包入口 |
| output | 打包产物位置和命名 |
| loader | 让 webpack 能处理 CSS、Vue、图片等非 JS 模块 |
| plugin | 扩展构建流程，例如生成 HTML、抽离 CSS |
| mode | 区分 development 和 production 行为 |
| devServer | 本地开发服务器和热更新 |

## 安装依赖

```bash
npm init -y
npm install vue
npm install webpack webpack-cli webpack-dev-server --save-dev
npm install vue-loader @vue/compiler-sfc --save-dev
npm install html-webpack-plugin mini-css-extract-plugin css-loader style-loader --save-dev
```

`@vue/compiler-sfc` 用来编译 Vue 3 单文件组件，`vue-loader` 负责把 `.vue` 文件接入 webpack 模块系统。

## 基本项目结构

```text
vue-webpack-app/
├── index.html
├── package.json
├── webpack.config.js
└── src/
    ├── App.vue
    ├── main.js
    └── assets/
```

### src/main.js

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

createApp(App).mount('#app')
```

### src/App.vue

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <main class="app">
    <h1>Vue 3 + webpack 5</h1>
    <button @click="count++">点击 {{ count }} 次</button>
  </main>
</template>
```

## package.json scripts

```json
{
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production"
  }
}
```

## webpack.config.js

```javascript
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { VueLoaderPlugin } = require('vue-loader')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024,
          },
        },
        generator: {
          filename: 'assets/images/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[contenthash:8][ext]',
        },
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    historyApiFallback: true,
    hot: true,
    port: 5173,
    open: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: 'single',
  },
}
```

## loader 配置说明

### Vue 单文件组件

```javascript
const { VueLoaderPlugin } = require('vue-loader')

module.exports = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ],
  },
  plugins: [new VueLoaderPlugin()],
}
```

Vue 3 项目需要 `@vue/compiler-sfc` 与 `vue-loader` 配合使用。

### CSS

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isProduction = process.env.NODE_ENV === 'production'

const cssRule = {
  test: /\.css$/,
  use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
}
```

开发环境用 `style-loader` 方便热更新，生产环境用 `mini-css-extract-plugin` 输出独立 CSS 文件。

### 图片与字体

webpack 5 内置资源模块，不需要再额外安装传统资源 loader。

```javascript
const imageRule = {
  test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 8 * 1024,
    },
  },
}
```

`asset` 会按体积自动决定内联还是输出文件，`asset/resource` 则总是输出文件。

## 开发服务器

```javascript
module.exports = {
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    historyApiFallback: true,
    hot: true,
    port: 5173,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    ],
  },
}
```

`historyApiFallback` 适合 Vue Router 的 history 模式，刷新详情页时会回退到 `index.html`。

## 代码分割

路由页面可以用动态导入拆分为独立 chunk。

```javascript
const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/about',
    component: () => import('@/views/AboutView.vue'),
  },
]
```

webpack 会为动态导入生成独立文件，首屏只加载必要代码。

## 生产优化

### 缓存命名

```javascript
module.exports = {
  output: {
    filename: 'js/[name].[contenthash:8].js',
    chunkFilename: 'js/[name].[contenthash:8].chunk.js',
  },
}
```

`contenthash` 会在文件内容变化时更新，适合浏览器长期缓存。

### 公共依赖拆分

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
    runtimeChunk: 'single',
  },
}
```

公共依赖拆分后，业务代码变化不会频繁影响第三方库缓存。

## 与 Vite 的选择

| 场景 | 建议 |
|------|------|
| 新 Vue 3 应用 | 优先使用 Vite |
| 历史项目升级 | 可以保留 webpack 5 并逐步现代化配置 |
| 复杂构建定制 | webpack 插件生态更适合深度控制 |
| 组件库开发 | Vite 和 webpack 都可用，按团队工具链选择 |

## 小结

- Vue 3 + webpack 5 使用 `vue-loader` 和 `@vue/compiler-sfc` 编译单文件组件。
- webpack 5 内置资源模块，可以替代传统图片、字体 loader。
- 开发服务器使用 `devServer.static`、`hot` 和 `historyApiFallback`。
- 生产构建重点关注 `contenthash`、代码分割、公共依赖拆分和 CSS 抽离。
