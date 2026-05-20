---
title: Electron 打包与分发详解
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: electron-packaging-distribution
description: '详细介绍Electron应用打包工具electron-builder的使用、配置选项、打包流程及分发策略。'
tags:
  - Electron
  - electron-builder
  - 打包
  - 分发
  - 打包工具
draft: false
series: Electron
seriesOrder: 9
language: zh-CN
---

## 概述

开发完 Electron 应用后，需要将其打包成分发给用户的可执行文件。本文将详细介绍如何使用 electron-builder 打包应用，以及常见的配置选项和分发策略。📦

## 打包工具

### 主流打包工具

| 工具 | 说明 | 特点 |
|------|------|------|
| **electron-builder** | 官方推荐 | 功能全面、社区活跃 |
| **electron-packager** | 基础打包 | 轻量、简单 |
| **electron-forge** | 官方脚手架 | 一体化、配置简单 |

### 推荐：electron-builder

electron-builder 是目前最流行的 Electron 打包工具，支持：

- Windows: exe, msi
- macOS: dmg, pkg, app
- Linux: AppImage, deb, rpm 等
- 自动更新
- 代码签名
- 多平台交叉编译

## 快速开始

### 安装 electron-builder

```bash
npm install electron-builder --save-dev
```

### 基本打包命令

```bash
# 打包当前项目
npm run build

# 或直接使用 electron-builder
npx electron-builder
```

### package.json 配置

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.mycompany.myapp",
    "productName": "我的应用",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

## 详细配置

### 应用基本信息

```json
{
  "build": {
    "appId": "com.example.myapp",
    "productName": "我的应用名称",
    "copyright": "Copyright © 2024 Example",

    "directories": {
      "output": "dist",
      "buildResources": "build"
    },

    "files": [
      "main.js",
      "preload.js",
      "index.html",
      "renderer.js",
      "package.json"
    ],

    "extraMetadata": {
      "main": "main.js"
    }
  }
}
```

### Windows 配置

```json
{
  "build": {
    "win": {
      "icon": "build/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "artifactName": "${productName}-${version}-${arch}.${ext}"
    },

    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico",
      "installerHeaderIcon": "build/icon.ico",
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "我的应用"
    },

    "portable": {
      "artifactName": "${productName}-${version}-portable.${ext}"
    }
  }
}
```

### macOS 配置

```json
{
  "build": {
    "mac": {
      "icon": "build/icon.icns",
      "category": "public.app-category.productivity",
      "target": ["dmg", "zip"],
      "hardenedRuntime": true,
      "gatekeeperAssess": false
    },

    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ],
      "window": {
        "width": 540,
        "height": 400
      }
    }
  }
}
```

### Linux 配置

```json
{
  "build": {
    "linux": {
      "icon": "build/icons",
      "target": ["AppImage", "deb", "rpm"],
      "category": "Utility",
      "maintainer": "Your Name <your@email.com>"
    }
  }
}
```

### 多平台同时打包

```json
{
  "build": {
    "appId": "com.example.myapp",
    "productName": "我的应用",
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

## 文件配置

### files 和 excludes

```json
{
  "build": {
    "files": [
      "**/*",
      "!node_modules/**/*",
      "!src/**/*",
      "!*.md",
      "!.gitignore"
    ],

    "file": {
      "exclude": [
        "node_modules/@types"
      ]
    }
  }
}
```

### asar 打包

```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "resources/**"
    ]
  }
}
```

### 资源文件

```
build/
├── icon.ico        # Windows 图标
├── icon.icns      # macOS 图标
├── icon.png       # 源图标（PNG）
├── icons/         # Linux 图标目录
├── icon.256.png
├── icon.128.png
├── icon.64.png
└── uninstall.icns # 卸载程序图标
```

## 安装程序配置

### NSIS 安装器选项

```json
{
  "build": {
    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,

      "installerIcon": "build/icon.ico",
      "uninstallerIcon": "build/icon.ico",
      "installerHeaderIcon": "build/icon.ico",

      "license": "license.txt",

      "runAfterFinish": true,
      "shortcutName": "My App",

      "installerScript": "installer.nsh",
      "uninstallerScript": "uninstaller.nsh",

      "deleteAppDataOnUninstall": true,
      "differentialPackage": false
    }
  }
}
```

### 卸载相关文件

```markdown
<!-- license.txt -->
本软件受版权法保护...
```

### 脚本自定义

```nsis
; installer.nsh
!macro customHeader
  !include "MUI2.nsh"
!macroend

!macro preInit
  ; 安装前执行
!macroend

!macro customInstall
  ; 自定义安装逻辑
  WriteRegStr HKCU "Software\MyApp" "InstallPath" "$INSTDIR"
!macroend

!macro customUnInstall
  ; 自定义卸载逻辑
  DeleteRegKey HKCU "Software\MyApp"
!macroend
```

## 自动更新

### 配置 autoUpdater

```json
{
  "build": {
    "publish": [
      {
        "provider": "generic",
        "url": "https://example.com/updates/"
      }
    ]
  }
}
```

### 主进程更新代码

```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = false;

autoUpdater.on('checking-for-update', () => {
  console.log('检查更新中...');
});

autoUpdater.on('update-available', (info) => {
  console.log('发现新版本:', info.version);

  // 询问用户是否下载
  dialog.showMessageBox({
    type: 'info',
    title: '发现新版本',
    message: `发现新版本 ${info.version}，是否下载？`,
    buttons: ['是', '否']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('已是最新版本');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`下载进度: ${progress.percent.toFixed(2)}%`);
});

autoUpdater.on('update-downloaded', () => {
  console.log('下载完成');

  dialog.showMessageBox({
    type: 'info',
    title: '更新已就绪',
    message: '更新已下载完成，是否立即安装？',
    buttons: ['立即安装', '稍后']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('更新错误:', error);
});

// 检查更新
function checkForUpdates() {
  autoUpdater.checkForUpdates();
}
```

### 版本发布

```bash
# 发布到服务器
# 1. 构建并发布
npm run build

# 2. 上传版本文件到更新服务器
# 需要在 releases 目录上传以下文件：
# - latest.yml
# - 我的应用-1.0.0.exe
```

## 代码签名

### Windows 签名

```json
{
  "build": {
    "win": {
      "certificateFile": "./certificate.pfx",
      "certificatePassword": "your-password"
    }
  }
}
```

### macOS 签名

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "entitlements": "build/entitlements.plist",
      "entitlementsInherit": "build/entitlements.plist"
    }
  }
}
```

### entitlements.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

## 生产环境配置

### 环境变量

```javascript
// main.js
const isDev = !app.isPackaged;

console.log('是否开发环境:', isDev);
console.log('应用路径:', app.getAppPath());
console.log('资源路径:', process.resourcesPath);

// 根据环境加载配置
const configPath = isDev
  ? path.join(__dirname, 'config.json')
  : path.join(process.resourcesPath, 'config.json');
```

### 生产路径处理

```javascript
const path = require('path');

// 获取正确路径
function getPath(...parts) {
  const basePath = app.isPackaged
    ? process.resourcesPath
    : __dirname;
  return path.join(basePath, ...parts);
}

// 加载资源文件
function loadAsset(filename) {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'assets', filename)
    : path.join(__dirname, 'assets', filename);
}
```

### 启动参数

```javascript
// main.js
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 第二个实例启动时，主窗口聚焦
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
```

## 常见问题

### 图标尺寸要求

```bash
# Windows .ico 文件
至少包含: 16, 32, 48, 256 像素

# macOS .icns 文件
包含多种尺寸的 PNG

# Linux
至少包含: 16, 32, 48, 64, 128, 256, 512 像素
```

### 文件大小优化

```json
{
  "build": {
    "files": [
      "!**/*.{o,obj,pdb,lib,gch}",
      "!**/*{,.git,CVS,SCCS,_darcs,arch-ids,__pycache__}",
      "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!**/node_modules/.bin"
    ],
    "asar": true,
    "compression": "maximum"
  }
}
```

### Windows 32位兼容

```json
{
  "build": {
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64", "ia32"] }
      ]
    }
  }
}
```

## 完整示例

### 项目结构

```
my-electron-app/
├── package.json
├── main.js
├── preload.js
├── index.html
├── renderer.js
├── build/
│   ├── icon.ico
│   ├── icon.icns
│   └── icon.png
├── license.txt
└── dist/               # 打包输出目录
```

### package.json

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "我的 Electron 应用",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --win --x64",
    "build:all": "electron-builder --win --mac --linux"
  },
  "build": {
    "appId": "com.mycompany.myapp",
    "productName": "我的应用",
    "copyright": "Copyright © 2024 My Company",

    "directories": {
      "output": "dist",
      "buildResources": "build"
    },

    "files": [
      "main.js",
      "preload.js",
      "index.html",
      "renderer.js"
    ],

    "win": {
      "icon": "build/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    },

    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },

    "publish": {
      "provider": "generic",
      "url": "https://example.com/updates/"
    }
  },

  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

### 发布命令

```bash
# 仅打包 Windows
npm run build

# 打包所有平台
npm run build:all

# 打包并发布
npx electron-builder --win --x64 --publish always
```

## 总结

本文介绍了 Electron 应用打包和分发的完整流程：

| 步骤 | 说明 |
|------|------|
| **安装工具** | npm install electron-builder |
| **配置 package.json** | 设置应用信息、平台配置 |
| **准备资源** | 图标、许可证文件 |
| **打包应用** | npm run build |
| **配置自动更新** | electron-updater |
| **代码签名** | Windows/macOS 签名 |

下一篇文章我们将学习 **调试与性能优化**，敬请期待！🔧
