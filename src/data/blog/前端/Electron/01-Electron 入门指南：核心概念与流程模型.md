---
title: Electron 入门指南：核心概念与流程模型
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: electron-getting-started
description: '详细介绍Electron框架的核心概念、架构特点、主进程与渲染进程的流程模型。'
tags:
  - Electron
  - 桌面应用
  - 跨平台
  - 前端框架
draft: false
series: Electron
seriesOrder: 1
language: zh-CN
---

## 概述

Electron 是一个使用 **JavaScript、HTML 和 CSS** 构建桌面应用程序的框架。它允许开发者使用熟悉的 Web 技术栈开发跨平台桌面应用，一套代码即可打包为 Windows、macOS、Linux 三个平台的安装包。🎉

### Electron 的核心特点

| 特性 | 说明 |
|------|------|
| **跨平台** | 一套代码，多平台运行 |
| **Web 技术栈** | 使用 HTML/CSS/JS 开发 |
| **Chromium 内核** | 统一的渲染引擎 |
| **Node.js 集成** | 可访问系统底层能力 |
| **活跃生态** | VS Code、Slack、Figma 等知名应用采用 |

### Electron vs 其他框架

| 框架 | 优点 | 缺点 |
|------|------|------|
| **Electron** | 开发便捷、生态丰富 | 包体积较大（约100MB起步） |
| **Tauri** | 包体积小、性能好 | 生态较新 |
| **nw.js** | 功能全面 | 维护不活跃 |

## 核心概念

### 什么是 Electron

Electron 的核心原理很简单：既然网页可以在浏览器中运行，而浏览器是原生应用程序，那只要把浏览器和网页打包在一起，前端应用就可以成为原生应用了。Electron 使用了谷歌的 **Chromium 浏览器** 作为渲染引擎，并集成了 **Node.js 运行时**，使得前端应用可以访问文件系统、网络、系统通知等原生能力。

```
┌─────────────────────────────────────────────────────────────┐
│                      Electron 架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   你的应用代码                          │   │
│  │   ┌──────────────┐  ┌──────────────┐                │   │
│  │   │  HTML/CSS   │  │ JavaScript   │                │   │
│  │   └──────────────┘  └──────────────┘                │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Chromium 渲染引擎                         │   │
│  │   └── 负责界面渲染、Web API 执行                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Node.js 运行时                         │   │
│  │   └── 文件系统、网络、操作系统交互                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 主进程（Main Process）

主进程是 Electron 应用的入口点，负责管理应用的生命周期、创建窗口、处理系统级事件。在一个 Electron 应用中，只有一个主进程。

**主进程职责：**
- 创建和管理应用窗口
- 处理应用生命周期事件（启动、退出）
- 创建系统菜单和托盘图标
- 处理 IPC 通信（接收渲染进程消息）
- 访问文件系统、网络等系统资源
- 管理原生界面元素

```javascript
// main.js
const { app, BrowserWindow } = require('electron');

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载 HTML 文件
  mainWindow.loadFile('index.html');
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 渲染进程（Renderer Process）

渲染进程负责显示网页内容，每个窗口对应一个渲染进程。渲染进程运行在 Chromium 环境中，无法直接访问系统资源，但可以通过 IPC 与主进程通信。

**渲染进程职责：**
- 渲染网页内容（HTML/CSS）
- 执行 JavaScript 代码
- 处理用户界面交互
- 通过 IPC 与主进程通信
- 访问 Web API（DOM、BOM）

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的 Electron 应用</title>
</head>
<body>
  <h1>欢迎使用 Electron！</h1>
  <button id="btn">点击我</button>
  
  <script src="renderer.js"></script>
</body>
</html>
```

```javascript
// renderer.js
document.getElementById('btn').addEventListener('click', () => {
  console.log('按钮被点击了！');
});
```

### 预加载脚本（Preload Script）

预加载脚本在渲染进程加载之前执行，可以安全地暴露主进程 API 给渲染进程，同时保持上下文隔离。它是 Electron 安全架构的重要组成部分。

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body)
});
```

```javascript
// renderer.js - 使用预加载暴露的 API
const content = await window.electronAPI.readFile('/path/to/file.txt');
console.log('文件内容:', content);
```

## 流程模型

### 进程通信架构

```
┌─────────────────────────────────────────────────────────────┐
│                     IPC 通信模型                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │       主进程          │    │     渲染进程          │      │
│  │                      │    │                      │      │
│  │  ┌────────────────┐  │    │  ┌────────────────┐  │      │
│  │  │  app 模块      │  │    │  │  preload.js    │  │      │
│  │  │  BrowserWindow │  │    │  │  (上下文隔离)   │  │      │
│  │  │  ipcMain       │  │    │  └───────┬────────┘  │      │
│  │  └───────┬────────┘  │    │          │           │      │
│  │          │            │    │  ┌───────┴────────┐  │      │
│  │          │            │    │  │ renderer.js   │  │      │
│  │          │            │    │  │ (你的代码)     │  │      │
│  │          │            │    │  └────────────────┘  │      │
│  │          │            │    │                      │      │
│  └──────────┼────────────┘    └──────────────────────┘      │
│             │                                                  │
│       IPC 通信                                                │
│             │                                                  │
│  ┌──────────┼────────────┐                                   │
│  │    invoke/handle     │                                   │
│  │    send/on           │                                   │
│  │    sendSync/on       │                                   │
│  └──────────────────────┘                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### IPC 通信方式

Electron 提供了三种主要的 IPC 通信方式：

| 方式 | 说明 | 使用场景 |
|------|------|----------|
| **invoke/handle** | 异步双向通信（推荐） | 大部分场景 |
| **send/on** | 单向异步通信 | 事件通知 |
| **sendSync/on** | 同步通信（不推荐） | 避免使用，阻塞主进程 |

**invoke/handle 方式（推荐）：**

```javascript
// main.js - 处理渲染进程请求
const { ipcMain } = require('electron');

ipcMain.handle('read-file', async (event, filePath) => {
  const fs = require('fs').promises;
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

```javascript
// preload.js - 暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)
});
```

```javascript
// renderer.js - 调用 API
const result = await window.electronAPI.readFile('/path/to/file.txt');
if (result.success) {
  console.log('文件内容:', result.data);
}
```

## 模块系统

### 主要模块概览

| 模块 | 说明 |
|------|------|
| **app** | 应用生命周期管理 |
| **BrowserWindow** | 窗口创建和管理 |
| **ipcMain/ipcRenderer** | 进程间通信 |
| **Menu** | 应用菜单 |
| **Tray** | 系统托盘 |
| **Dialog** | 原生对话框 |
| **Notification** | 系统通知 |
| **shell** | 系统打开器 |
| **clipboard** | 剪贴板 |

### 常用模块示例

```javascript
const { app, BrowserWindow, Menu, Tray, dialog, Notification, shell } = require('electron');
const path = require('path');

// 应用窗口
const mainWindow = new BrowserWindow({ width: 1200, height: 800 });

// 对话框
const result = await dialog.showOpenDialog(mainWindow, {
  properties: ['openFile'],
  filters: [{ name: '文本文件', extensions: ['txt', 'md'] }]
});

// 系统通知
new Notification({ title: '通知标题', body: '通知内容' }).show();

// 使用系统默认应用打开文件
shell.openPath('/path/to/file.txt');

// 剪贴板
const { clipboard } = require('electron');
clipboard.writeText('复制到剪贴板');
```

## 应用生命周期

### 常用事件

```javascript
const { app } = require('electron');

// 应用准备就绪
app.whenReady().then(() => {
  console.log('应用已启动');
});

// 所有窗口关闭
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用激活（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用退出前
app.on('will-quit', () => {
  console.log('应用即将退出');
});
```

### 生命周期流程图

```
应用启动流程
═══════════════════════════════════════════

    ┌─────────────┐
    │   启动应用   │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  ready 事件  │ ← app.whenReady()
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  创建窗口    │ ← new BrowserWindow()
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  加载内容    │ ← loadFile() / loadURL()
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  应用运行中  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ window-all  │
    │ -closed     │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  退出应用   │ ← app.quit()
    └─────────────┘
```

## 开发工具

### Visual Studio Code

推荐使用 VS Code 开发 Electron 应用，它是使用 Electron 构建的编辑器，本身就是最好的证明。

**常用扩展：**
- ESLint - 代码检查
- Prettier - 代码格式化
- Debugger for Chrome - 调试渲染进程
- Electron Builder - 打包支持

### Electron Forge

Electron 官方推荐的脚手架工具，可以快速创建项目并打包：

```bash
# 创建新项目
npm create electron-app@latest my-app -- --template=webpack

# 进入目录
cd my-app

# 启动开发服务器
npm start

# 打包应用
npm run package
```

## 总结

本文介绍了 Electron 的核心概念：

1. **主进程**：管理应用生命周期，负责创建窗口和处理系统级事件
2. **渲染进程**：运行在 Chromium 中，负责显示网页内容
3. **预加载脚本**：在渲染进程加载前执行，安全暴露主进程 API
4. **IPC 通信**：主进程和渲染进程之间通信的桥梁
5. **模块系统**：app、BrowserWindow、Menu 等核心模块

理解这些核心概念后，你就可以开始构建自己的 Electron 应用了！🚀
