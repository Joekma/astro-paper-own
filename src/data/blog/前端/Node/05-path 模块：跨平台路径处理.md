---
title: path 模块：跨平台路径处理
author: Joekma
pubDatetime: 2026-06-01T00:00:00.000+08:00
modDatetime: 2026-06-01T00:00:00.000+08:00
slug: nodejs-path-module
description: '详解 Node.js 内置 path 模块：分隔符、join/resolve/basename/extname、__dirname 在 ESM 下的替代写法，附跨平台路径处理实战。'
tags:
  - Node.js
  - path
  - 跨平台
  - 路径
draft: false
series: Node.js 深入浅出
seriesOrder: 5
language: zh-CN
---

## 一、这篇文章要解决什么问题

写 Node.js 代码时，**只要碰到"文件位置"就会遇到路径问题**。新手常见的报错：

- 在 Windows 上跑得好好的脚本，到 Linux 服务器上就 `ENOENT: no such file or directory`。
- `fs.readFile('a/b/c.txt')` 在 Mac 上能跑，到 Windows 上变 `a\b\c.txt` 又能跑。
- ESM 项目里 `__dirname` 突然 `undefined`，一脸懵。
- 配置文件里写了 `./data/db.json`，结果启动目录不同就读不到。

这一切的根源是：**路径分隔符在 Windows 是 `\`，在 Mac/Linux 是 `/`**。Node.js 用 `path` 模块帮你抹平这个差异。

## 二、先用一句话讲清楚

**`path` 模块是 Node.js 内置的"路径工具箱"，提供 `join`、`resolve`、`basename`、`extname` 等方法，帮你在 Windows、Mac、Linux 三种系统上用同一份代码正确处理文件路径。**

## 三、官方文档是怎么说的

[Node.js 中文文档 - Path](https://nodejs.cn/api/path.html) 开篇：

> `path` 模块提供用于处理文件路径的实用工具。
>
> 几乎所有方法都只对**字符串**进行转换。文件系统不会被该模块检查是否真实存在。

补充理解（不在原文）：

- Node.js 在 Windows 和 POSIX（Mac/Linux）系统上有**两套** `path` 实现，**通过 `process.platform` 自动判断**。
- 也可以手动 `require('path/win32')` 或 `require('path/posix')` 强制指定。
- 新代码统一用 `node:path` 前缀导入，和用户包区分开。

## 四、换成人话怎么理解

`path` 模块就像一个**"翻译 + 拆解"路径的瑞士军刀**：

- **`join`**：把多段路径拼起来，自动加上正确的分隔符（`/` 或 `\`）。
- **`resolve`**：把相对路径"翻译"成绝对路径，像 `cd` 命令一样解析 `..` 和 `.`。
- **`basename`**：从完整路径里取出**文件名**。
- **`dirname`**：从完整路径里取出**目录名**。
- **`extname`**：从完整路径里取出**扩展名**。
- **`parse`**：把一个路径拆成 `{ root, dir, base, ext, name }` 对象。
- **`format`**：`parse` 的反操作，把对象拼回路径。
- **`sep`**：当前系统的路径分隔符（Win `\`，POSIX `/`）。

记住一句话：**只要在 Node.js 里写"文件位置"，就用 `path` 函数，别用字符串拼接。**

## 五、最小可运行示例

> 本节 ESM 写法，CJS 把 `import` 换成 `require('node:path')` 即可。

### 5.1 拼接路径：join vs resolve

```js
// path-demo.mjs
import path from 'node:path';

// 1. join：纯拼接，用当前系统的分隔符
const a = path.join('foo', 'bar', 'baz.txt');
console.log(a);
// Windows:  foo\bar\baz.txt
// Mac/Linux: foo/bar/baz.txt

// 2. resolve：基于"当前工作目录（CWD）"解析为绝对路径
const b = path.resolve('foo', 'bar', 'baz.txt');
console.log(b);
// Windows:  C:\Users\Joekma\foo\bar\baz.txt
// Mac/Linux: /Users/joekma/foo/bar/baz.txt

// 3. resolve 遇到绝对路径会"重置"起点
const c = path.resolve('/tmp', 'a', '/etc', 'b');
console.log(c); // /etc/b
```

**对比：**

| 函数 | 行为 | 适用场景 |
| ---- | ---- | -------- |
| `join` | 纯字符串拼接，**不访问文件系统** | 组装**相对路径**或子路径 |
| `resolve` | 从 CWD 开始解析，遇到绝对路径就重置 | 拿到**绝对路径**（如 `__dirname` 拼接） |

### 5.2 拆解路径

```js
import path from 'node:path';

const p = '/Users/joekma/photos/2026/IMG_001.jpg';

console.log(path.dirname(p));   // /Users/joekma/photos/2026
console.log(path.basename(p));  // IMG_001.jpg
console.log(path.extname(p));   // .jpg
console.log(path.parse(p));
// {
//   root: '/',
//   dir: '/Users/joekma/photos/2026',
//   base: 'IMG_001.jpg',
//   ext: '.jpg',
//   name: 'IMG_001'
// }
```

### 5.3 跨平台：手动指定 win32 或 posix

```js
import path from 'node:path';

// 强制用 Windows 规则
path.win32.join('a', 'b', 'c.txt'); // 'a\\b\\c.txt'

// 强制用 POSIX 规则
path.posix.join('a', 'b', 'c.txt'); // 'a/b/c.txt'
```

> 真实项目中很少用，但写跨平台工具（如 electron-builder 内部）会用到。

### 5.4 ESM 里怎么拿"当前文件目录"（替代 `__dirname`）

```js
// in ESM (.mjs) —— __dirname 不存在
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

console.log(__dirname);
```

**为什么？** `__dirname` 是 CJS 注入的魔法变量，ESM 里**没有**。但每个 ESM 模块都可以通过 `import.meta.url` 拿到自己的文件 URL（`file:///...`），用 `fileURLToPath` 翻译成本地路径，再用 `dirname` 取目录。

### 5.5 path 与 fs 搭配：读当前目录的 config

```js
// read-config.mjs
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));

const configPath = join(__dirname, 'config.json');
const text = await readFile(configPath, 'utf8');
console.log(JSON.parse(text));
```

> 这种"基于当前文件位置定位其他资源"是写**可移植脚本**的标准做法——不依赖 CWD，无论从哪个目录启动都能找到。

## 六、实际项目中怎么用

| 场景 | 推荐写法 | 原因 |
| ---- | -------- | ---- |
| **拼接同目录文件** | `path.join(__dirname, 'a.json')` | 无论从哪启动都正确 |
| **拼接用户数据目录** | `path.join(app.getPath('userData'), 'cache')` | 跨平台用户目录（Electron） |
| **读 URL 路径** | `url.fileURLToPath(new URL('./a.json', import.meta.url))` | ESM 推荐写法 |
| **生成相对路径给前端** | `path.posix.join('static', 'img', 'a.png')` | 前端永远用 `/` |
| **打日志文件路径** | `path.join(process.cwd(), 'logs', 'app.log')` | 跟启动目录走 |
| **生成可执行命令行** | `process.execPath` 或 `__filename` | 找 node 自身 |

补充理解（不在原文）—— Electron 里的 userData 目录：

```js
// main.js (Electron)
import { app } from 'electron';
import path from 'node:path';

const userData = app.getPath('userData');       // Windows: %APPDATA%/MyApp
                                                // Mac: ~/Library/Application Support/MyApp
                                                // Linux: ~/.config/MyApp
const dbPath = path.join(userData, 'app.db');
```

## 七、常见误区

### 误区 1：用字符串拼接路径

- **错在哪里**：`const p = dir + '/' + file`。
- **为什么会错**：Windows 上会得到 `dir\file`，下次再拼 `dir + '/' + file` 就成了 `dir\/file`，看着像但系统不认。
- **正确写法**：`path.join(dir, file)`，自动用正确分隔符。

### 误区 2：把 `__dirname` 用在 ESM 文件里

- **错在哪里**：在 `.mjs` 或 `type: module` 的项目里写 `__dirname`。
- **为什么会错**：ESM 没有这个魔法变量，会报 `__dirname is not defined`。
- **正确写法**：
  ```js
  // ESM 推荐：用 URL + fileURLToPath
  import { fileURLToPath } from 'node:url';
  import { dirname } from 'node:path';
  const __dirname = dirname(fileURLToPath(import.meta.url));
  
  // 或者更直接
  import { readFile } from 'node:fs/promises';
  const config = await readFile(new URL('./config.json', import.meta.url), 'utf8');
  ```

### 误区 3：`./config.json` 看似简单其实有坑

- **错在哪里**：在 `app.js` 里写 `fs.readFile('./config.json')`。
- **为什么会错**：这里的 `./` 是 **process.cwd()**（启动命令的目录），**不是 `app.js` 所在目录**。当用 `node src/app.js` 启动时，Node 会去 `src/` 下找；但用 `cd .. && node src/app.js` 启动时，Node 会去上一级找，结果就读不到了。
- **正确写法**：用 `path.join(__dirname, 'config.json')` 或 `new URL('./config.json', import.meta.url)`。

### 误区 4：分不清 `resolve` 和 `join`

- **错在哪里**：以为两者差不多。
- **为什么会错**：`resolve` 在拼接时遇到**绝对路径**会**重置**起点，`join` 不会。
- **正确理解**：
  ```js
  path.join('/a', '/b', 'c')   // '/a/b/c'
  path.resolve('/a', '/b', 'c') // '/b/c'   ← 绝对路径重置了起点
  ```

### 误区 5：用 `path` 处理 URL

- **错在哪里**：把 `https://example.com/a/b?x=1` 喂给 `path.basename`。
- **为什么会错**：`path` 处理的是**文件系统路径**，不是 URL。
- **正确写法**：URL 用 [`url`](https://nodejs.cn/api/url.html) 模块的 `URL` 类：
  ```js
  const u = new URL('https://example.com/a/b?x=1');
  u.pathname;  // '/a/b'
  u.search;    // '?x=1'
  ```

## 八、和相似概念的区别

| 概念 | 是什么 | 关键差异 |
| ---- | ------ | -------- |
| **`path.join`** | 纯拼接，不读磁盘 | 结果**不一定是绝对路径** |
| **`path.resolve`** | 从 CWD 解析为绝对路径 | 结果**一定是绝对路径** |
| **`__dirname`**（CJS） | 当前文件所在目录 | 绝对路径 |
| **`process.cwd()`** | 进程启动时的目录 | **不等于** `__dirname` |
| **`import.meta.url`**（ESM） | 当前文件的 file:// URL | 需要 `fileURLToPath` 转换 |
| **`url` 模块的 `URL`** | 处理 HTTP/HTTPS URL | 不处理文件系统路径 |

## 九、小结

1. **跨平台路径处理一定要用 `path` 模块**，别用字符串拼接。
2. `path.join` 用于**拼接子路径**，`path.resolve` 用于**解析成绝对路径**。
3. `__dirname` 是 CJS 专属；**ESM 里用 `import.meta.url` + `fileURLToPath`**。
4. 配置文件、静态资源等**相对文件位置的资源**，用 `__dirname` 或 `new URL(..., import.meta.url)` 定位，**别用 `process.cwd()`**。
5. URL 用 `url.URL`，文件路径用 `path`——**别混用**。

---

下一篇我们将学习 **06-HTTP 模块：从零手写 Web 服务器**——不依赖 Express，用 Node.js 原生能力搭一个能处理 GET/POST、解析 JSON Body、返回正确状态码的服务。
