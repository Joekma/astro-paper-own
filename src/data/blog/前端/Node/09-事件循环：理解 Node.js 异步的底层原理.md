---
title: 事件循环：理解 Node.js 异步的底层原理
author: Joekma
pubDatetime: 2026-06-01T00:00:00.000+08:00
modDatetime: 2026-06-01T00:00:00.000+08:00
slug: nodejs-event-loop
description: 'Node.js 事件循环全景：六阶段（Timers/Pending/Idle/Check/Close）+ 微任务（process.nextTick / Promise）+ libuv + 线程池。附代码实验与面试题。'
tags:
  - Node.js
  - 事件循环
  - 异步
  - 原理
draft: false
series: Node.js 深入浅出
seriesOrder: 9
language: zh-CN
---

## 一、这篇文章要解决什么问题

上一篇讲了三种异步写法。这一篇要回答一个更深的问题：

> **"setTimeout(() => console.log('A'), 0)"、"Promise.resolve().then(() => console.log('B'))"、"fs.readFile(...)"、"setImmediate(() => console.log('C'))"——这四段代码，谁先打印？**

这是 Node.js 面试最常考的问题，也是理解 Node.js 异步行为的关键。答错说明没真正理解事件循环（Event Loop）。

这一篇会讲清楚：

- Node.js 事件循环的 **6 个阶段**；
- **宏任务 vs 微任务** 的区别；
- `process.nextTick`、`queueMicrotask`、`setImmediate` 的微妙差异；
- Node.js "单线程"的真相（**libuv 线程池**）；
- 为什么"CPU 密集"会卡死 Node。

## 二、先用一句话讲清楚

**Node.js 的事件循环 = libuv 提供的一个"循环跑"机制。它有 6 个阶段，每个阶段处理一类异步任务，阶段之间会清空所有微任务。`setTimeout` 走 Timers 阶段，`setImmediate` 走 Check 阶段，`Promise.then` 走微任务队列，`process.nextTick` 优先级最高。**

## 三、官方文档是怎么说的

[Node.js 中文文档 - 事件循环](https://nodejs.cn/learn/the-nodejs-event-loop) 原文：

> 事件循环使 Node.js 可以通过将操作卸载到**系统内核**（只要有可能）来执行非阻塞 I/O 操作。
>
> 大多数现代操作系统内核都是**多线程**的，它们可以在后台处理多个操作。当这些操作之一完成时，内核会告诉 Node.js，以便**适当的回调**可以被添加到**轮询队列**中以便最终执行。

补充理解（不在原文，但很重要）：

- Node.js 自己的"JS 部分"是**单线程**的：一次只跑一段 JS。
- 但底层 I/O（文件、网络、DNS）由 **libuv** 维护的**线程池**（默认 4 个线程）处理，处理完后把回调塞回主线程。
- "事件循环" = 主线程反复**从队列里取回调执行**。

## 四、换成人话怎么理解

把 Node.js 想象成**一个银行的"大厅经理"**：

- 大厅里**只有一个经理**（主线程，单线程 JS）。
- 客户（异步任务）来办事：有的要办**存款**（`setTimeout`）、有的要办**理财**（I/O）、有的要办**保险**（`setImmediate`）。
- 经理桌上有**6 个窗口**，按顺序是：
  1. **定时器窗口**（处理到期的 `setTimeout` / `setInterval`）
  2. **待处理回调窗口**（处理系统级回调，如 TCP 错误）
  3. **空闲准备窗口**（仅内部使用）
  4. **轮询窗口**（轮询 I/O，把完成的 I/O 回调拿出来）
  5. **检测窗口**（执行 `setImmediate`）
  6. **关闭回调窗口**（处理 `socket.close()` 等）
- 每个窗口办完事，经理**马上处理桌上一沓"微任务便签"**（`Promise.then` / `queueMicrotask`），**便签没清空，经理不走**。
- 经理桌下还有 **4 个小弟**（libuv 线程池），帮客户去"仓库取资料"（读文件、查 DNS），取完送回大厅交给经理。

总结：**经理在大厅里转圈（事件循环），桌下有 4 个小弟跑腿（线程池）**。

## 五、最小可运行示例

### 5.1 经典执行顺序

```js
// order.mjs
console.log('1. 同步');

setTimeout(() => console.log('2. setTimeout 0'), 0);

setImmediate(() => console.log('3. setImmediate'));

Promise.resolve().then(() => console.log('4. Promise.then'));

process.nextTick(() => console.log('5. nextTick'));

queueMicrotask(() => console.log('6. queueMicrotask'));

console.log('7. 同步结束');
```

**预期输出（Node.js 18+）：**

```text
1. 同步
7. 同步结束
5. nextTick        ← 微任务，但比普通微任务优先级更高
4. Promise.then    ← 微任务
6. queueMicrotask  ← 微任务
2. setTimeout 0    ← Timers 阶段
3. setImmediate    ← Check 阶段
```

**为什么？**

1. 同步代码先跑（1、7）。
2. 然后清空**微任务队列**：注意 `process.nextTick` 的回调有一个**独立队列**，**在所有微任务之前**清空。所以 5 在 4、6 前面。
3. 之后进入事件循环的 **Timers 阶段**，跑 `setTimeout`（2）。
4. 然后经过几个阶段来到 **Check 阶段**，跑 `setImmediate`（3）。

### 5.2 验证"微任务在阶段之间清空"

```js
// microtask.mjs
setTimeout(() => {
  console.log('A. setTimeout');
  Promise.resolve().then(() => console.log('B. Promise in setTimeout'));
}, 0);

setTimeout(() => {
  console.log('C. setTimeout 2');
}, 0);
```

**输出：**

```text
A. setTimeout
B. Promise in setTimeout   ← 在阶段之间被清空
C. setTimeout 2
```

> 即使 `Promise.then` 在 `setTimeout` 里产生，它也会**优先于**下一个阶段执行——这就是"微任务插队"。

### 5.3 nextTick vs queueMicrotask

```js
Promise.resolve().then(() => console.log('microtask 1'));
process.nextTick(() => console.log('nextTick 1'));
process.nextTick(() => console.log('nextTick 2'));
Promise.resolve().then(() => console.log('microtask 2'));
```

**输出：**

```text
nextTick 1
nextTick 2
microtask 1
microtask 2
```

- `process.nextTick` 的回调有**自己独立的队列**，**在所有 Promise 微任务之前**清空。
- 官方文档明确**不推荐滥用** `process.nextTick`，可能造成"饿死 I/O"。

### 5.4 I/O 完成 vs setImmediate

```js
// io-vs-immediate.mjs
import { readFile } from 'node:fs/promises';

await readFile(__filename);                // 故意至少完成一次 I/O

setImmediate(() => console.log('immediate'));
setTimeout(() => console.log('timeout 0'), 0);
```

**输出（绝大多数情况下）：**

```text
immediate
timeout 0
```

**为什么？** 在 I/O 回调内部调度的 `setImmediate`，**总是**比 `setTimeout(..., 0)` 先执行——因为**事件循环处在 Poll 阶段之后，会先进入 Check 阶段**。

### 5.5 单线程的"陷阱"：CPU 密集任务

```js
// block.mjs
// 同步的 for 循环会"独占"主线程，期间所有异步回调都得排队
const start = Date.now();
function block(ms) {
  const end = start + ms;
  while (Date.now() < end) { /* 死循环 */ }
}

setTimeout(() => console.log('setTimeout 不会被准时执行'), 100);
block(1000);    // 阻塞主线程 1 秒
console.log('done');
```

**结果：** `done` 之后 900ms 才打印 setTimeout——因为**循环阻塞了事件循环，setTimeout 回调拿不到执行机会**。

> Node.js **不适合 CPU 密集**任务。**遇到用 `worker_threads`**（后续章节会讲）。

## 六、实际项目中怎么用

### 6.1 Node.js 6 个阶段速查

| 阶段 | 处理什么 | 常见 API |
| ---- | -------- | -------- |
| **Timers** | 到期的 `setTimeout` / `setInterval` | `setTimeout(cb, 0)` |
| **Pending callbacks** | 系统级回调（如 TCP ECONNREFUSED） | 内部使用 |
| **Idle, prepare** | 内部 | 内部使用 |
| **Poll** | 新的 I/O 事件；执行 I/O 回调 | 文件、网络 |
| **Check** | `setImmediate` | `setImmediate(cb)` |
| **Close callbacks** | 关闭回调 | `socket.on('close', ...)` |

**阶段之间**会清空：

- **nextTick 队列**（最高优先级）
- **微任务队列**（`Promise.then` / `queueMicrotask`）

### 6.2 执行顺序的"决策树"

1. **同步代码** 最先。
2. **process.nextTick** 然后。
3. **Promise 微任务 / queueMicrotask** 之后。
4. **事件循环阶段**：Timers → Pending → Poll → Check → Close，**循环往复**。
5. 每个阶段结束都**重新清空 nextTick + 微任务**。

### 6.3 真实项目里"事件循环"相关的两个常见需求

**(1) 把重任务拆到下一个 tick，让 UI/网络先响应：**

```js
// 让出主线程
function yieldToLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function processBigArray(arr) {
  for (let i = 0; i < arr.length; i++) {
    processItem(arr[i]);
    if (i % 1000 === 0) await yieldToLoop();   // 每 1000 个让出一次
  }
}
```

**(2) 让同步代码"看起来异步"：**

```js
// 利用 nextTick 把回调推到同步代码之后
function asyncLike(fn) {
  process.nextTick(fn);
}
console.log('A');
asyncLike(() => console.log('B'));
console.log('C');
// 输出：A C B
```

### 6.4 调整线程池大小

```bash
# 默认 4 个线程处理 fs/dns/crypto(部分) 等
node --max-old-space-size=4096 app.js
UV_THREADPOOL_SIZE=8 node app.js
```

```js
// 运行时调整（必须在任何 fs 调用之前）
process.env.UV_THREADPOOL_SIZE = '8';
```

## 七、常见误区

### 误区 1：以为 `setTimeout(fn, 0)` 就一定立即执行

- **错在哪里**：以为 `setTimeout(fn, 0)` 几乎"立即"调用 fn。
- **为什么会错**：要等主线程执行栈空 + 当前阶段结束 + 微任务清空，**最快也要几毫秒**。
- **正确理解**：
  - 想"下个阶段跑" → `setImmediate`
  - 想"等几毫秒" → `setTimeout`
  - 想"让出主线程一次" → `await new Promise(setImmediate)` 或 `setImmediate(resolve)`

### 误区 2：`setTimeout(0)` 和 `setImmediate` 等价

- **错在哪里**：在任意位置混用两者，期望行为一致。
- **为什么会错**：在**主模块顶层**调用时，顺序**不固定**（取决于机器性能）；在 **I/O 回调内部**，`setImmediate` 总是先于 `setTimeout`。
- **正确写法**：明确意图——"立即检查"用 `setImmediate`，"定时"用 `setTimeout`。

### 误区 3：在主线程做 CPU 密集计算

- **错在哪里**：用 `for` 循环处理 10 万条数据，期间 HTTP 请求全卡住。
- **为什么会错**：JS 单线程，**CPU 密集阻塞事件循环**，所有 I/O 回调排队等待。
- **正确写法**：
  - 用 **Worker Threads**（CPU 密集）
  - 用 **子进程**（隔离运行环境）
  - 用 **C++ addon**（极致性能）
  - 把活儿**拆批**（前面 6.3 的 `yieldToLoop` 思路）

### 误区 4：把 process.nextTick 当万能

- **错在哪里**：递归 `process.nextTick` 处理大数组。
- **为什么会错**：nextTick 队列**永远在微任务和 I/O 之前清空**，可能**饿死 I/O**。
- **正确写法**：用 `setImmediate` 或 `await new Promise(setImmediate)` 替代。

### 误区 5：以为 Node.js 是"多线程"

- **错在哪里**：把 libuv 线程池当成"Node.js 多线程"。
- **为什么会错**：JS 引擎本身**只有一条主线程**跑 JS。线程池只处理**内核 I/O**（读文件、DNS、crypto.pbkdf2），**不跑 JS**。
- **正确理解**：想"多线程跑 JS" → `worker_threads`。

## 八、和相似概念的区别

| 概念 | 是什么 | 关键差异 |
| ---- | ------ | -------- |
| **Node.js 主线程** | 跑 JS 代码的线程 | 单线程，事件循环驱动 |
| **libuv 线程池** | 处理内核 I/O 的 C 线程池 | 默认 4 线程，**不跑 JS** |
| **Worker Threads** | Node.js 10.5+ 的 JS 多线程 | 真多线程跑 JS，**共享 ArrayBuffer** |
| **Child Process** | 启动独立 Node 进程 | 进程间通信靠 IPC / pipe |
| **浏览器 Event Loop** | 浏览器也用事件循环 | 阶段划分略有不同，无 `setImmediate`，有 `requestAnimationFrame` |
| **Python asyncio** | 协程事件循环 | 单线程协程，await 语法相似但生态完全不同 |

## 九、小结

1. **Node.js 事件循环 = libuv 的循环**：6 个阶段（Timers、Pending、Idle、Poll、Check、Close），**阶段间清空 nextTick 和微任务**。
2. **执行优先级**：同步 > `process.nextTick` > `Promise.then` / `queueMicrotask` > 阶段回调。
3. **`setImmediate`** 走 Check 阶段；**`setTimeout`** 走 Timers 阶段；在 I/O 回调中**`setImmediate` 总是先于 `setTimeout(0)`**。
4. **CPU 密集会卡死事件循环**——用 `worker_threads` 或拆批 + `await yieldToLoop()` 让出主线程。
5. Node.js **"单线程"指 JS 部分**；**I/O 由 libuv 线程池**完成——这两点要分清。

---

下一篇我们将学习 **10-Stream 流式处理：大文件与背压机制**——搞懂为什么"流"是 Node.js 处理大文件、网络、管道传输的统一抽象。
