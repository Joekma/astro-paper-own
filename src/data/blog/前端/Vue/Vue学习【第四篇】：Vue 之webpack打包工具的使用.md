---
title: webpack打包工具使用
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: webpack-bundler-tutorial
featured: false
draft: false
tags:
  - webpack
  - 前端
  - 构建工具
  - JavaScript
description: 'webpack打包工具详解，包括安装配置、loader、plugin和优化'
---

> webpack 是现代 JavaScript 应用程序的静态模块打包器。

## webpack 简介

### 核心概念

| 概念 | 说明 |
|------|------|
| **入口(entry)** | 打包起点 |
| **输出(output)** | 打包结果 |
| **loader** | 处理非 JS 文件 |
| **plugin** | 扩展功能 |
| **mode** | 模式(development/production) |

## 安装

```bash
npm init -y
npm install webpack webpack-cli --save-dev
```

## 基本配置

### webpack.config.js

```javascript
const path = require('path')

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
}
```

### package.json scripts

```json
{
    "scripts": {
        "dev": "webpack --mode development",
        "build": "webpack --mode production"
    }
}
```

## loader

### 处理 CSS

```bash
npm install style-loader css-loader --save-dev
```

```javascript
module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
}
```

### 处理图片

```bash
npm install file-loader --save-dev
```

```javascript
{
    test: /\.(png|jpg|gif)$/,
    use: ['file-loader']
}
```

### 处理 ES6+

```bash
npm install babel-loader @babel/core @babel/preset-env --save-dev
```

```javascript
{
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
        loader: 'babel-loader',
        options: {
            presets: ['@babel/preset-env']
        }
    }
}
```

### 处理 Vue

```bash
npm install vue-loader vue-template-compiler --save-dev
```

```javascript
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    plugins: [
        new VueLoaderPlugin()
    ],
    module: {
        rules: [
            { test: /\.vue$/, loader: 'vue-loader' }
        ]
    }
}
```

## plugin

### HtmlWebpackPlugin

自动生成 HTML 文件：

```bash
npm install html-webpack-plugin --save-dev
```

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            filename: 'index.html',
            inject: 'body'
        })
    ]
}
```

### CleanWebpackPlugin

清空输出目录：

```bash
npm install clean-webpack-plugin --save-dev
```

```javascript
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
    plugins: [
        new CleanWebpackPlugin()
    ]
}
```

### MiniCssExtractPlugin

分离 CSS 文件：

```bash
npm install mini-css-extract-plugin --save-dev
```

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].css'
        })
    ]
}
```

## 开发服务器

```bash
npm install webpack-dev-server --save-dev
```

```javascript
module.exports = {
    devServer: {
        contentBase: './dist',
        hot: true,
        port: 8080,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
}
```

### 热模块替换

```javascript
module.exports = {
    devServer: {
        hot: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
}
```

## 优化

### 代码分割

```javascript
module.exports = {
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10
                }
            }
        }
    }
}
```

### Tree Shaking

```javascript
module.exports = {
    mode: 'production',
    optimization: {
        usedExports: true
    }
}
```

### 压缩

```javascript
module.exports = {
    mode: 'production',
    optimization: {
        minimize: true
    }
}
```

## 完整配置示例

```javascript
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'js/[name].[contenthash:8].js',
        path: path.resolve(__dirname, 'dist'),
        chunkFilename: 'js/[name].[contenthash:8].chunk.js'
    },
    module: {
        rules: [
            { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
            { test: /\.(png|jpg|gif)$/, use: 'file-loader' },
            { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './src/index.html',
            minify: { collapseWhitespace: true }
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:8].css'
        })
    ],
    devServer: {
        hot: true,
        port: 8080
    },
    optimization: {
        splitChunks: { chunks: 'all' }
    }
}
```

## 小结

- **entry/output**：入口和出口配置
- **loader**：处理 CSS、图片、ES6+、Vue 等
- **plugin**：HtmlWebpackPlugin、CleanWebpackPlugin、MiniCssExtractPlugin
- **devServer**：开发服务器和热更新
- **优化**：代码分割、Tree Shaking、压缩
