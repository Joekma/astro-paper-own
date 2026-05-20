---
title: Electron 开发环境搭建与快速入门
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: electron-environment-setup
description: '详细介绍Electron开发环境的搭建、项目初始化、快速创建一个可运行的Electron应用程序。'
tags:
  - Electron
  - 环境搭建
  - 快速入门
  - 桌面应用
draft: false
series: Electron
seriesOrder: 2
language: zh-CN
---

## 概述

本文将详细介绍如何搭建 Electron 开发环境，并从零开始创建一个完整的 Electron 应用程序。通过本教程，你将掌握项目初始化、代码编写、开发调试的基础技能。🚀

## 环境准备

### 前置要求

在开始之前，请确保你的开发环境满足以下要求：

| 要求 | 说明 |
|------|------|
| **Node.js** | 推荐 v16 LTS 或更高版本，最低 v14.17+ |
| **npm** | 通常随 Node.js 一起安装 |
| **网络** | 需要能够下载 Electron 和相关依赖 |

### 检查 Node.js 版本

```bash
# 检查 Node.js 版本
node -v

# 检查 npm 版本
npm -v
```

如果版本过低，请前往 [Node.js 官网](https://nodejs.org/) 下载安装最新版本。

### 网络配置（可选）

对于中国大陆用户，建议配置 npm 镜像源以加速下载：

```bash
# 配置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 如果使用 Electron 时遇到下载问题，单独设置 Electron 镜像
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
```

或者使用环境变量：

```bash
# Windows PowerShell
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# Windows CMD
setx ELECTRON_MIRROR "https://npmmirror.com/mirrors/electron/"
```

## 项目初始化

### 方式一：手动初始化

#### 1. 创建项目目录

```bash
# 创建项目文件夹
mkdir my-electron-app
cd my-electron-app

# 初始化 npm 项目
npm init -y
```

#### 2. 修改 package.json

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "我的第一个 Electron 应用",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --enable-logging"
  },
  "author": "Your Name",
  "license": "MIT"
}
```

**配置说明：**
- `main`: 主进程入口文件（必须是 `main.js` 或指定路径）
- `scripts.start`: 启动命令
- `--enable-logging`: 输出 Chromium 日志，便于调试

#### 3. 安装 Electron

```bash
# 作为开发依赖安装
npm install electron --save-dev

# 或指定版本安装
npm install electron@28.0.0 --save-dev
```

#### 4. 创建主进程文件

```javascript
// main.js
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
```

#### 5. 创建渲染进程文件

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的 Electron 应用</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    h1 { text-align: center; }
    .card {
      background: rgba(255,255,255,0.1);
      padding: 2rem;
      border-radius: 1rem;
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <h1>🎉 欢迎使用 Electron！</h1>
  <div class="card">
    <p>你的第一个桌面应用已成功运行！</p>
    <button id="btn" style="padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer;">
      点击测试
    </button>
    <p id="result"></p>
  </div>
  
  <script src="renderer.js"></script>
</body>
</html>
```

```javascript
// renderer.js
document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('result').textContent = '✅ 交互成功！';
});
```

### 方式二：使用 Electron Forge（推荐）

Electron Forge 是官方推荐的脚手架工具，提供更完善的项目结构和打包支持：

```bash
# 创建基于 webpack 模板的项目
npm create electron-app@latest my-electron-app -- --template=webpack

# 进入目录
cd my-electron-app

# 安装依赖
npm install

# 启动开发服务器
npm start
```

Electron Forge 自动配置了：
- 热重载（修改代码自动刷新）
- TypeScript 支持
- 打包工具集成
- 更好的项目结构

### 方式三：使用 Vite + Electron

如果你熟悉 Vite，可以使用 `electron-vite` 插件：

```bash
# 创建项目
npm create @electron-vite/create

# 或使用模板
npm create electron-vite electron-vite-project -- --template vanilla

cd electron-vite-project
npm install
npm run dev
```

## 完整项目结构

### 基础结构

```
my-electron-app/
├── package.json          # 项目配置
├── main.js               # 主进程入口
├── preload.js            # 预加载脚本
├── index.html            # 渲染进程 HTML
├── renderer.js           # 渲染进程 JavaScript
└── node_modules/         # 依赖目录
```

### 完整结构（使用 Forge）

```
my-electron-app/
├── package.json
├── forge.config.js       # Forge 配置
├── webpack.main.config.js
├── webpack.renderer.config.js
├── webpack.rules.js
├── src/
│   ├── main/
│   │   └── index.js      # 主进程
│   ├── preload/
│   │   └── index.js     # 预加载脚本
│   └── renderer/
│       ├── index.html   # 渲染进程 HTML
│       ├── index.js     # 渲染进程入口
│       └── styles.css   # 样式文件
└── assets/               # 静态资源
```

## 运行应用

### 开发模式

```bash
# 基础启动
npm start

# 带日志输出
npm run dev

# 使用 Forge
npm run start
```

如果一切正常，你应该会看到一个桌面窗口，显示你的应用界面。

### 常见问题排查

#### 1. 窗口黑屏

如果窗口显示黑屏，可能是 HTML 文件路径错误：

```javascript
// 检查路径
console.log(__dirname);
console.log(path.join(__dirname, 'index.html'));

// 使用绝对路径
win.loadFile(path.join(__dirname, 'index.html'));
```

#### 2. 无法运行 postinstall

Electron 需要运行 `postinstall` 脚本来下载二进制文件：

```bash
# 确保没有忽略脚本
npm install --ignore-scripts=false

# 手动运行 postinstall
npm run postinstall
```

#### 3. 网络下载失败

```bash
# 设置镜像后重试
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
npm install
```

#### 4. Windows 用户

避免在 WSL 环境中开发 Electron，可能遇到兼容性问题。在 Windows 原生终端或 PowerShell 中运行。

## 开发技巧

### 启用开发者工具

在开发时启用 DevTools 便于调试：

```javascript
// main.js
const win = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js')
  }
});

// 开发模式下打开 DevTools
if (process.env.NODE_ENV === 'development') {
  win.webContents.openDevTools();
}
```

### 热重载

手动实现简单的热重载：

```javascript
// main.js
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800
  });

  // 加载页面
  win.loadFile('index.html');

  // 开发模式下监听文件变化
  if (process.env.NODE_ENV === 'development') {
    const chokidar = require('chokidar');
    chokidar.watch('index.html').on('change', () => {
      win.loadFile('index.html');
    });
  }
}
```

### 多窗口管理

```javascript
// main.js
const { app, BrowserWindow } = require('electron');

let mainWindow = null;
let secondaryWindow = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  mainWindow.loadFile('index.html');

  secondaryWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  secondaryWindow.loadFile('secondary.html');
});

// 获取所有窗口
app.on('window-all-closed', () => {
  app.quit();
});

// 获取当前窗口数量
console.log(BrowserWindow.getAllWindows().length);
```

## 完整示例：带 IPC 通信的应用

### main.js

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // 启用上下文隔离
      nodeIntegration: false   // 禁用 Node.js 集成
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // 处理渲染进程的消息
  ipcMain.handle('get-app-info', async () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform
    };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info')
});
```

### renderer.js

```javascript
async function init() {
  const info = await window.electronAPI.getAppInfo();
  console.log('应用信息:', info);
  
  document.getElementById('app-name').textContent = info.name;
  document.getElementById('app-version').textContent = 'v' + info.version;
  document.getElementById('app-platform').textContent = info.platform;
}

init();
```

### index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Electron 应用</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #f5f5f5; }
    .info-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .info-item { margin: 0.5rem 0; }
    .label { font-weight: bold; color: #666; }
  </style>
</head>
<body>
  <div class="info-card">
    <h2>📦 应用信息</h2>
    <div class="info-item"><span class="label">名称：</span><span id="app-name">-</span></div>
    <div class="info-item"><span class="label">版本：</span><span id="app-version">-</span></div>
    <div class="info-item"><span class="label">平台：</span><span id="app-platform">-</span></div>
  </div>
  <script src="renderer.js"></script>
</body>
</html>
```

## 总结

本文介绍了 Electron 开发环境的搭建方法：

1. **环境准备**：Node.js 安装、npm 镜像配置
2. **项目初始化**：手动方式 vs Electron Forge
3. **基本结构**：main.js、preload.js、index.html
4. **运行调试**：npm start、热重载、DevTools
5. **完整示例**：包含 IPC 通信的最小可行应用

下一篇文章我们将深入学习 **主进程与渲染进程** 的详细机制。敬请期待！💪
