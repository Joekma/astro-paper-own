---
title: Node.js基础
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: nodejs-basics-tutorial
featured: false
draft: false
tags:
  - Node.js
  - JavaScript
  - 后端
  - 前端
description: 'Node.js基础，包括安装、npm包管理、模块系统和Express框架'
---

> Node.js 是基于 Chrome V8 引擎的 JavaScript 运行环境。

## 安装

```bash
# Windows
# 下载安装包: https://nodejs.org/

# macOS
brew install node

# 验证
node --version
npm --version
```

## npm 包管理

```bash
# 初始化项目
npm init -y

# 安装包
npm install express          # 安装
npm install --save-dev nodemon  # 开发依赖
npm install -g pm2            # 全局安装

# 其他命令
npm list                      # 查看已安装
npm uninstall express         # 卸载
npm update express           # 更新
npm search express          # 搜索
```

## 模块系统

### CommonJS

```javascript
// 导出
module.exports = {
    add: (a, b) => a + b,
    name: 'Utils'
}

// 导入
const utils = require('./utils')
console.log(utils.add(1, 2))
```

### ES Module

```javascript
// 导出
export const add = (a, b) => a + b
export default class Utils { }

// 导入
import { add } from './utils'
import Utils from './utils'
import * as utils from './utils'
```

## Express 框架

### 基本使用

```bash
npm install express
```

```javascript
const express = require('express')
const app = express()

// 中间件
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// GET 请求
app.get('/api/users', (req, res) => {
    res.json([{ id: 1, name: '张三' }])
})

// POST 请求
app.post('/api/users', (req, res) => {
    const user = req.body
    res.json({ id: 2, ...user })
})

// 路由参数
app.get('/api/users/:id', (req, res) => {
    res.json({ id: req.params.id })
})

// 启动服务器
app.listen(3000, () => {
    console.log('服务器启动: http://localhost:3000')
})
```

## 小结

- **Node.js**：JavaScript 运行时环境
- **npm**：包管理工具
- **模块**：CommonJS 和 ES Module
- **Express**：Web 框架
