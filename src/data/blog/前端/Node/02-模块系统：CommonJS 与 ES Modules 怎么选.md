---
title: 模块系统：CommonJS 与 ES Modules 怎么选
author: Joekma
pubDatetime: 2026-06-01T00:00:00.000+08:00
modDatetime: 2026-06-01T00:00:00.000+08:00
slug: nodejs-modules-cjs-esm
description: '深入讲解 Node.js 的两大模块系统 CommonJS 与 ES Modules，包括工作原理、互操作、Node 18+ 的现状以及新项目怎么选。'
tags:
  - Node.js
  - 模块系统
  - CommonJS
  - ESM
draft: false
series: Node.js 深入浅出
seriesOrder: 2
language: zh-CN
---

## 一、这篇文章要解决什么问题

当你写 Node.js 代码写到几十个文件、上百个函数的时候，必然会遇到三个问题：

1. 怎么把一个文件里的函数/常量"导出"出去给别的文件用？
2. 怎么把别人导出的东西"导入"到当前文件？
3. 老项目用 `require`，新项目用 `import`，这俩到底能不能混？混用为什么会报错？

这就是 Node.js 的**模块系统**。它是 Node.js 项目组织的基石：把代码拆成一个个可复用、可独立测试的小单元。

Node.js 在历史上先后支持了两套模块系统——**CommonJS（CJS）** 和 **ES Modules（ESM）**。它们长得像但本质不同，新人最大的坑就是"混着用报错却不知道为什么"。

## 二、先用一句话讲清楚

**Node.js 的模块系统 = 把多个 JS 文件拆开组织、按需加载的规则。CommonJS 是 Node.js 原生老方案（`require`/`module.exports`），ES Modules 是浏览器和现代 Node 都采用的官方标准（`import`/`export`）。**

## 三、官方文档是怎么说的

Node.js 中文文档（https://nodejs.cn/api/modules.html）开篇明确说明：

> 在 Node.js 模块系统中，每个文件都被视为一个独立的模块。Node.js 默认使用 **CommonJS** 模块系统。从 **v13.2.0** 开始，Node.js **默认支持 ES Modules**，且不需要任何标志。

补充理解（不属于官方文档原文，只是背景）：

- CommonJS 是 2009 年 Node.js 出生时就自带的方案，是 Node.js 生态里**几乎所有老库**采用的格式。
- ES Modules 是 ECMAScript 语言标准（TC39）定义的模块语法，**浏览器原生支持**，Node.js 在 12+ 逐步支持，13.2 起稳定，14+ 推荐。

## 四、换成人话怎么理解

把一个项目想成一栋大楼：

- 每个 JS 文件 = 一个**房间**。房间之间**互相不直接通**，必须走"门"才能借东西。
- "导出"（export）= 房间门上的**小窗**，可以把自己家的工具/家具递出去。
- "导入"（import）= 从门上的窗**拿**别人递过来的工具。
- 两种模块系统 = 两套**门窗规格**：
  - CommonJS：老规格，门窗用 `require`/`module.exports`。
  - ES Modules：新规格，门窗用 `import`/`export`。

Node.js 早期只有老规格，后来为了跟浏览器统一，加了**新规格**。但老房子（老项目/老 npm 包）太多，所以新规格要"兼容老规格"——这就是后面要讲的"互操作"。

## 五、最小可运行示例

> **本节基于 Node.js 18+**，所有代码请用 `.cjs`（CommonJS）或 `.mjs`（ESM）后缀以便对照运行；如用 `.js`，则依赖 `package.json` 里的 `"type"` 字段（详见第八节）。

### 5.1 CommonJS 示例（math.cjs）

```js
// math.cjs —— 用 module.exports 导出
function add(a, b) {
  return a + b;
}
function sub(a, b) {
  return a - b;
}

module.exports = { add, sub };
```

```js
// app.cjs —— 用 require 导入
const { add, sub } = require('./math.cjs');

console.log(add(2, 3)); // 5
console.log(sub(10, 4)); // 6
```

**逐行解释：**

- `module.exports = { add, sub }`：把 `add`、`sub` 这两个函数**打包成一个对象**扔出去。
- `require('./math.cjs')`：**同步**加载 `math.cjs`，返回它导出的对象 `{ add, sub }`。
- 解构 `const { add, sub } = ...`：从对象里取出需要的函数。

### 5.2 ES Modules 示例（math.mjs）

```js
// math.mjs —— 用 export 导出
export function add(a, b) {
  return a + b;
}
export function sub(a, b) {
  return a - b;
}
```

```js
// app.mjs —— 用 import 导入
import { add, sub } from './math.mjs';

console.log(add(2, 3)); // 5
console.log(sub(10, 4)); // 6
```

**逐行解释：**

- `export function ...`：**逐个**声明"这个函数可以被外部使用"，比 CJS 更细致。
- `import { add, sub } from './math.mjs'`：**静态分析**的导入（路径必须是字符串字面量，不能是变量拼接）。`import` 写在文件顶部，**提升到所有代码之前**执行。

### 5.3 混用的坑：ESM 里加载 CJS

```js
// app.mjs
import pkg from './math.cjs';
console.log(pkg.add(2, 3)); // 5
```

- ESM 里**只能用 default import** 引入 CJS。
- `import { add } from './math.cjs'` 这种具名导入**会失败**（可能得到 undefined），因为 CJS 没法在加载前告诉 ESM 它有哪些具名导出。

### 5.4 混用的坑：CJS 里加载 ESM

```js
// app.cjs
const math = require('./math.mjs'); // 报错
```

```text
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported.
```

- **CJS 不能同步 `require` 一个 ESM**。因为 ESM 是异步加载的。
- 解决办法：用 `import()` 动态导入。
  ```js
  // app.cjs
  (async () => {
    const math = await import('./math.mjs');
    console.log(math.add(2, 3)); // 5
  })();
  ```

## 六、实际项目中怎么用

### 6.1 怎么决定用 CJS 还是 ESM

| 场景 | 推荐 | 原因 |
| ---- | ---- | ---- |
| 新项目（2024 之后启动） | **ESM** | 浏览器/Node.js/工具链都向 ESM 收敛 |
| 需要被老库/老工具链依赖 | CJS | 几乎所有老 npm 包都是 CJS |
| 写一个工具库要给两类人用 | **双格式发布** | 编译时输出 CJS + ESM（Vite/Rollup 都支持） |
| 写服务端代码不打算给浏览器 | ESM 或 CJS 均可 | Node.js 14+ 两种都稳定 |

### 6.2 三种"告诉 Node 用哪种模块系统"的方式

```bash
# 方式 1：文件后缀
*.cjs  # 强制 CJS
*.mjs  # 强制 ESM
*.js   # 看 package.json 的 "type" 字段
```

```json
// 方式 2：package.json
{
  "type": "commonjs" // 默认；所有 .js 当作 CJS
}

{
  "type": "module"   // 默认；所有 .js 当作 ESM
}
```

```js
// 方式 3：命令行参数
node --input-type=module -e "import('fs').then(console.log)"
```

### 6.3 真实项目里最常见的"互操作"模式

1. **CJS 项目用 ESM 库**（如 `chalk@5+`、`node-fetch@3+`）
   - 直接 `const chalk = (await import('chalk')).default;`，包在 async 函数里。
2. **ESM 项目用 CJS 库**（如 `express`、`lodash`）
   - `import express from 'express'` 用默认导入即可。
3. **工具库双格式发布**
   ```json
   {
     "exports": {
       ".": {
         "import": "./dist/index.mjs",
         "require": "./dist/index.cjs"
       }
     }
   }
   ```

## 七、常见误区

### 误区 1：以为 `import` 是异步的，所以 `require` 更快

- **错在哪里**：很多人以为 `import` 增加了"异步等待"的延迟。
- **为什么会错**：`import` 是**静态声明**（编译阶段就解析完了），运行时其实是**同步完成绑定**的；只有**动态 `import()`** 才是真异步。
- **正确理解**：性能差异极小，可忽略；选哪种看生态和团队规范，不看性能。

### 误区 2：`import` 路径必须写完整后缀

- **错在哪里**：在浏览器里能省略 `.js` 后缀，写 Node.js 也省略，结果报错。
- **为什么会错**：Node.js 的 ESM **严格要求**文件扩展名（出于和浏览器规范一致的设计）。
- **正确写法**：
  ```js
  // 浏览器里可以省略，Node.js 里不行
  import { add } from './math.mjs'; // ✅
  import { add } from './math';     // ❌ ERR_MODULE_NOT_FOUND
  ```

### 误区 3：`require` 可以动态拼路径，`import` 不行

- **错在哪里**：以为 `import` 没 `require` 灵活。
- **为什么会错**：静态 `import` 路径必须是字面量，但**动态 `import()` 可以传变量**。
- **正确写法**：
  ```js
  // 静态 import
  import { add } from './math.mjs';
  
  // 动态 import（异步、可拼路径）
  const moduleName = './math.mjs';
  const math = await import(moduleName);
  ```

### 误区 4：`module.exports` 和 `exports` 完全等价

- **错在哪里**：写 `exports = { add, sub }`，以为和 `module.exports = { add, sub }` 等价。
- **为什么会错**：`exports` 只是 `module.exports` 的一个**引用**；你给 `exports` 整体重新赋值，并不会改变 `module.exports`，但别人 `require` 拿到的还是原来那个空对象。
- **正确写法**：
  ```js
  // 正确
  module.exports = { add, sub };
  // 或
  exports.add = (a, b) => a + b;
  exports.sub = (a, b) => a - b;
  
  // 错误（外部 require 不到）
  exports = { add, sub };
  ```

### 误区 5：在 ESM 里直接 `__dirname`/`__filename`

- **错在哪里**：在 `.mjs` 文件里用 `__dirname`，以为和 CJS 一样。
- **为什么会错**：ESM 没有这两个魔法变量（它们是 CJS 注入的）。
- **正确写法**：
  ```js
  // ESM 等价写法
  import { fileURLToPath } from 'node:url';
  import { dirname } from 'node:path';
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

## 八、和相似概念的区别

| 概念 | CommonJS (CJS) | ES Modules (ESM) |
| ---- | -------------- | ---------------- |
| 语法 | `require` / `module.exports` | `import` / `export` |
| 加载方式 | 同步、动态 | 静态（提升） / 动态 `import()` |
| 出现时间 | 2009，Node.js 出生自带 | ES2015 规范，Node 13.2+ 默认支持 |
| 浏览器 | ❌ 不原生支持 | ✅ 原生支持 |
| 后缀/识别 | `.cjs` 或 `.js` + `type:commonjs` | `.mjs` 或 `.js` + `type:module` |
| 互操作 | 可 `require` CJS | ESM 可默认导入 CJS；CJS 不可 `require` ESM |
| 常见坑 | `exports` 重新赋值、循环引用 | 路径必须带扩展名、不能 `require` |
| 典型使用者 | express、lodash、几乎所有老库 | chalk 5+、node-fetch 3+、vite 插件 |

## 九、小结

1. Node.js 有两套模块系统：**CommonJS（`require`）** 和 **ES Modules（`import`）**，默认行为由 `package.json` 的 `type` 字段或文件后缀决定。
2. **新项目首选 ESM**；老项目维持 CJS；库建议**双格式发布**。
3. **CJS 可以 `require` CJS，ESM 可以 import CJS；CJS 不能 `require` ESM**，需要用 `import()`。
4. ESM 的 `import` 路径**必须带扩展名**，且不能像 `require` 那样用变量拼路径（用动态 `import()` 替代）。
5. 记住两条黄金规则：**看 `package.json` 的 `type`，看文件后缀**——这是排查模块错误的起点。

---

下一篇我们将学习 **03-npm 与工程化：package.json、依赖、脚本与版本管理**，把项目从"几个文件"升级为"可发布的工程"。
