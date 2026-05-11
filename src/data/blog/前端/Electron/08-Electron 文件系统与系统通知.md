---
title: Electron 文件系统与系统通知
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: electron-filesystem-notifications
description: '详细介绍Electron文件系统操作fs模块的使用、系统通知Notification API及实际应用场景。'
tags:
  - Electron
  - 文件系统
  - fs
  - Notification
  - 系统通知
draft: false
series: Electron
language: zh-CN
---

## 概述

Electron 通过集成 Node.js 的 `fs` 模块，提供了强大的文件系统操作能力，同时支持系统通知功能。本文将详细介绍这些功能的使用方法。📁

## 文件系统操作

### 基础文件操作

```javascript
const fs = require('fs');
const fsPromises = require('fs').promises;

// 推荐使用 Promise 版本
async function fileOperations() {
  // 读取文件
  const content = await fsPromises.readFile('/path/to/file.txt', 'utf-8');

  // 写入文件（覆盖）
  await fsPromises.writeFile('/path/to/file.txt', 'Hello World', 'utf-8');

  // 追加内容
  await fsPromises.appendFile('/path/to/file.txt', '\nNew line', 'utf-8');

  // 删除文件
  await fsPromises.unlink('/path/to/file.txt');
}
```

### 文件读取

```javascript
// 读取整个文件
const content = await fsPromises.readFile('/path/to/file.txt', 'utf-8');
console.log(content);

// 读取二进制文件
const buffer = await fsPromises.readFile('/path/to/image.png');

// 读取 Buffer
const buffer = await fsPromises.readFile('/path/to/file.txt');
console.log(buffer.toString('utf-8'));

// 使用 Buffer 转字符串
const content = Buffer.from(buffer).toString();
```

### 文件写入

```javascript
// 写入文本
await fsPromises.writeFile('/path/to/file.txt', 'Hello World', 'utf-8');

// 写入二进制
await fsPromises.writeFile('/path/to/image.png', imageBuffer);

// 追加内容
await fsPromises.appendFile('/path/to/log.txt', 'New log entry\n', 'utf-8');

// 指定编码写入
await fsPromises.writeFile('/path/to/file.txt', 'content', {
  encoding: 'utf-8',
  flag: 'w'  // 'w' 写入, 'a' 追加
});
```

### 文件状态

```javascript
// 获取文件状态
const stats = await fsPromises.stat('/path/to/file.txt');

console.log('是否为文件:', stats.isFile());
console.log('是否为目录:', stats.isDirectory());
console.log('文件大小:', stats.size, '字节');
console.log('创建时间:', stats.birthtime);
console.log('修改时间:', stats.mtime);
console.log('访问时间:', stats.atime);

// 检查文件是否存在
async function fileExists(path) {
  try {
    await fsPromises.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
```

### 文件操作

```javascript
// 复制文件
await fsPromises.copyFile('/source.txt', '/dest.txt');

// 复制文件（覆盖）
await fsPromises.copyFile('/source.txt', '/dest.txt', fs.constants.COPYFILE_EXCL);

// 移动文件
await fsPromises.rename('/old/path.txt', '/new/path.txt');

// 删除文件
await fsPromises.unlink('/path/to/file.txt');

// 重命名
await fsPromises.rename('/old.txt', '/new.txt');
```

### 目录操作

```javascript
// 创建目录
await fsPromises.mkdir('/path/to/dir');

// 递归创建目录
await fsPromises.mkdir('/path/to/nested/dir', { recursive: true });

// 读取目录内容
const files = await fsPromises.readdir('/path/to/dir');
console.log(files);

// 读取目录详细信息
const fileInfos = await fsPromises.readdir('/path/to/dir', { withFileTypes: true });

for (const file of fileInfos) {
  console.log(`${file.isDirectory() ? '[DIR]' : '[FILE]'} ${file.name}`);
}

// 删除目录（必须为空）
await fsPromises.rmdir('/path/to/empty/dir');

// 递归删除目录
await fsPromises.rm('/path/to/dir', { recursive: true, force: true });
```

### 路径操作

```javascript
const path = require('path');

// 拼接路径
const fullPath = path.join(__dirname, 'subdir', 'file.txt');

// 获取绝对路径
const absolutePath = path.resolve('./relative/path.txt');

// 获取文件名
path.basename('/path/to/file.txt')  // 'file.txt'
path.basename('/path/to/file.txt', '.txt')  // 'file'

// 获取扩展名
path.extname('/path/to/file.txt')  // '.txt'

// 获取目录名
path.dirname('/path/to/file.txt')  // '/path/to'

// 获取文件名（不含扩展名）
path.basename('/path/to/file.txt', path.extname('/path/to/file.txt'))  // 'file'
```

### 递归目录操作

```javascript
// 递归列出所有文件
async function listFilesRecursive(dirPath) {
  const results = [];

  async function walk(dir) {
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        results.push(fullPath);
      }
    }
  }

  await walk(dirPath);
  return results;
}

// 递归复制目录
async function copyDir(src, dest) {
  await fsPromises.mkdir(dest, { recursive: true });

  const entries = await fsPromises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fsPromises.copyFile(srcPath, destPath);
    }
  }
}
```

### 文件监控

```javascript
const fs = require('fs');

// 监听文件变化
const watcher = fs.watch('/path/to/dir', (eventType, filename) => {
  console.log(`事件类型: ${eventType}, 文件名: ${filename}`);
});

// 使用 watchFile（定期检查）
fs.watchFile('/path/to/file.txt', { interval: 1000 }, (curr, prev) => {
  if (curr.mtime.getTime() !== prev.mtime.getTime()) {
    console.log('文件已修改');
  }
});

// 取消监听
fs.unwatchFile('/path/to/file.txt');

// 关闭 watcher
watcher.close();
```

### 流操作

```javascript
// 创建读取流
const readStream = fs.createReadStream('/path/to/file.txt', {
  encoding: 'utf-8',
  highWaterMark: 64 * 1024  // 64KB
});

readStream.on('data', (chunk) => {
  console.log('接收到数据块:', chunk);
});

readStream.on('end', () => {
  console.log('读取完成');
});

readStream.on('error', (err) => {
  console.error('读取错误:', err);
});

// 创建写入流
const writeStream = fs.createWriteStream('/path/to/output.txt');

writeStream.write('Hello ');
writeStream.write('World\n');
writeStream.end();

writeStream.on('finish', () => {
  console.log('写入完成');
});

// 管道流
const input = fs.createReadStream('/path/to/input.txt');
const output = fs.createWriteStream('/path/to/output.txt');

input.pipe(output);
```

## 系统路径

### 应用路径

```javascript
const { app } = require('electron');

// 获取各种常用路径
const paths = {
  // 用户数据目录
  userData: app.getPath('userData'),

  // 临时文件目录
  temp: app.getPath('temp'),

  // 应用根目录
  appPath: app.getAppPath(),

  // 桌面目录
  desktop: app.getPath('desktop'),

  // 文档目录
  documents: app.getPath('documents'),

  // 下载目录
  downloads: app.getPath('downloads'),

  // 图片目录
  pictures: app.getPath('pictures'),

  // 音乐目录
  music: app.getPath('music'),

  // 视频目录
  videos: app.getPath('videos'),

  // 用户主目录
  home: app.getPath('home')
};

console.log(paths);
```

### 文件路径在 IPC 中的使用

```javascript
// main.js
const { app, ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

ipcMain.handle('file:save-to-user-data', async (event, filename, content) => {
  const filePath = path.join(app.getPath('userData'), filename);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
});

ipcMain.handle('file:read-from-user-data', async (event, filename) => {
  const filePath = path.join(app.getPath('userData'), filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
});

ipcMain.handle('file:list-user-data', async () => {
  const files = await fs.readdir(app.getPath('userData'));
  return files;
});
```

## 系统通知

### 创建通知

```javascript
const { Notification } = require('electron');

// 基本通知
const notification = new Notification({
  title: '新消息',
  body: '您有 3 条未读消息',
  icon: path.join(__dirname, 'icon.png'),
  silent: false  // 是否静音
});

notification.show();

// 带操作的通知
const notificationWithActions = new Notification({
  title: '文件下载完成',
  body: '点击查看或打开文件夹',
  actions: [
    { type: 'button', text: '查看' },
    { type: 'button', text: '打开文件夹' }
  ]
});

notificationWithActions.show();

// 带关闭回调
const notification = new Notification({
  title: '提示',
  body: '5秒后自动关闭'
});

notification.show();

setTimeout(() => {
  notification.close();
}, 5000);
```

### 通知事件

```javascript
const notification = new Notification({
  title: '测试通知',
  body: '点击查看详情'
});

// 点击事件
notification.on('click', () => {
  console.log('通知被点击');
  // 显示窗口
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.show();
    win.focus();
  }
});

// 显示事件
notification.on('show', () => {
  console.log('通知已显示');
});

// 关闭事件
notification.on('close', () => {
  console.log('通知已关闭');
});

// 操作事件
notification.on('action', (event, index) => {
  console.log(`用户点击了操作 ${index}`);
});
```

### 通知权限

```javascript
const { Notification } = require('electron');

// 检查是否支持通知
if (Notification.isSupported()) {
  const notification = new Notification({
    title: '标题',
    body: '内容'
  });
  notification.show();
} else {
  console.log('当前平台不支持通知');
}

// 检查权限状态（macOS）
console.log(Notification.permission);  // 'granted', 'denied', 'default'

// 请求权限（macOS）
Notification.requestPermission().then((permission) => {
  console.log('权限状态:', permission);
});
```

### 通知队列

```javascript
// 控制通知队列，防止过多通知
class NotificationQueue {
  constructor(maxVisible = 3) {
    this.queue = [];
    this.maxVisible = maxVisible;
    this.currentNotifications = [];
  }

  add(title, body) {
    const notification = new Notification({ title, body });

    notification.on('close', () => {
      this.currentNotifications = this.currentNotifications.filter(n => n !== notification);

      // 显示队列中的下一个
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.show(next);
      }
    });

    if (this.currentNotifications.length < this.maxVisible) {
      this.show(notification);
    } else {
      this.queue.push(notification);
    }
  }

  show(notification) {
    notification.show();
    this.currentNotifications.push(notification);
  }
}

const notifier = new NotificationQueue(3);
notifier.add('消息 1', '内容 1');
notifier.add('消息 2', '内容 2');
notifier.add('消息 3', '内容 3');
notifier.add('消息 4', '内容 4');  // 将排队等待
```

## 完整示例：文件管理器

### main.js

```javascript
const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const fs = require('fs').promises;
const path = require('path');

let mainWindow = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile('index.html');
});

ipcMain.handle('fs:read-directory', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name)
    }));
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:delete', async (event, targetPath) => {
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true });
    } else {
      await fs.unlink(targetPath);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('fs:create-folder', async (event, dirPath, folderName) => {
  try {
    const newPath = path.join(dirPath, folderName);
    await fs.mkdir(newPath, { recursive: true });
    return { success: true, path: newPath };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('dialog:open-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:save-file', async (event, defaultName) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [
      { name: '文本文件', extensions: ['txt'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled) return null;
  return result.filePath;
});

ipcMain.handle('notification:show', async (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
    return { success: true };
  }
  return { error: 'Notification not supported' };
});

ipcMain.handle('app:get-path', async () => {
  return app.getPath('documents');
});
```

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fsAPI', {
  readDirectory: (path) => ipcRenderer.invoke('fs:read-directory', path),
  readFile: (path) => ipcRenderer.invoke('fs:read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('fs:write-file', path, content),
  delete: (path) => ipcRenderer.invoke('fs:delete', path),
  createFolder: (dir, name) => ipcRenderer.invoke('fs:create-folder', dir, name),
  openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
  saveFile: (name) => ipcRenderer.invoke('dialog:save-file', name),
  showNotification: (title, body) => ipcRenderer.invoke('notification:show', title, body),
  getDocumentsPath: () => ipcRenderer.invoke('app:get-path')
});
```

### renderer.js（文件管理器 UI）

```javascript
let currentPath = '/';
let files = [];

async function init() {
  const docsPath = await window.fsAPI.getDocumentsPath();
  await navigateTo(docsPath);
}

async function navigateTo(path) {
  currentPath = path;
  const result = await window.fsAPI.readDirectory(path);

  if (result.error) {
    showError(result.error);
    return;
  }

  files = result;
  renderFileList();
}

async function openFile(file) {
  if (file.isDirectory) {
    await navigateTo(file.path);
  } else {
    const result = await window.fsAPI.readFile(file.path);
    if (result.error) {
      showError(result.error);
    } else {
      showFileContent(file.name, result.content);
    }
  }
}

async function deleteFile(file) {
  if (confirm(`确定要删除 ${file.name} 吗？`)) {
    const result = await window.fsAPI.delete(file.path);
    if (result.success) {
      await navigateTo(currentPath);
      await window.fsAPI.showNotification('删除成功', `${file.name} 已删除`);
    } else {
      showError(result.error);
    }
  }
}

async function createFolder() {
  const name = prompt('请输入文件夹名称：');
  if (name) {
    const result = await window.fsAPI.createFolder(currentPath, name);
    if (result.success) {
      await navigateTo(currentPath);
    } else {
      showError(result.error);
    }
  }
}

function renderFileList() {
  const container = document.getElementById('file-list');
  container.innerHTML = files.map(file => `
    <div class="file-item" onclick="openFile(${JSON.stringify(file).replace(/"/g, '&quot;')})">
      <span class="icon">${file.isDirectory ? '📁' : '📄'}</span>
      <span class="name">${file.name}</span>
      <button class="delete-btn" onclick="event.stopPropagation(); deleteFile(${JSON.stringify(file).replace(/"/g, '&quot;')})">删除</button>
    </div>
  `).join('');
}

function goUp() {
  const parentPath = path.dirname(currentPath);
  navigateTo(parentPath);
}
```

## 最佳实践

### 错误处理

```javascript
async function safeReadFile(filePath) {
  try {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    console.error('读取文件失败:', error);
    return { success: false, error: error.message };
  }
}

// 确保目录存在
async function ensureDir(dirPath) {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}
```

### 异步队列

```javascript
// 批量文件操作
async function batchProcess(files, processor) {
  const results = [];

  for (const file of files) {
    try {
      const result = await processor(file);
      results.push({ file, success: true, result });
    } catch (error) {
      results.push({ file, success: false, error: error.message });
    }
  }

  return results;
}
```

## 总结

本文介绍了 Electron 的文件系统操作和系统通知功能：

| 功能 | API | 说明 |
|------|------|------|
| **文件读写** | fs.readFile/writeFile | 读取和写入文件内容 |
| **目录操作** | fs.mkdir/readdir | 创建和读取目录 |
| **文件状态** | fs.stat | 获取文件元信息 |
| **流操作** | fs.createReadStream | 大文件流式处理 |
| **文件监控** | fs.watch | 监听文件变化 |
| **系统通知** | Notification | 显示系统通知 |
| **应用路径** | app.getPath | 获取系统目录路径 |

熟练掌握这些功能可以让你构建功能丰富的桌面应用。下一篇文章我们将学习 **打包与分发详解**，敬请期待！📦
