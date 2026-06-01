---
title: 进程与子进程：spawn、exec、fork
author: Joekma
pubDatetime: 2026-06-01T00:00:00.000+08:00
modDatetime: 2026-06-01T00:00:00.000+08:00
slug: nodejs-process-child-process
description: '详解 Node.js process 全局对象、child_process 的四种创建方式（spawn/exec/execFile/fork）、父子进程 IPC、cluster 多进程模型、常见误区与实战示例。'
tags:
  - Node.js
  - 进程
  - child_process
  - cluster
draft: false
series: Node.js 深入浅出
seriesOrder: 12
language: zh-CN
---

## 一、这篇文章要解决什么问题

Node.js 是**单进程**的——只有一个主线程跑 JS。这带来两个天然限制：

1. **CPU 密集**会卡死主线程（上一讲说过）。
2. **多核 CPU 用不上**——8 核机器只能跑满 1 核。

解决办法就是**多进程**。Node.js 提供了：

- **`process`** 全局对象：访问当前进程的信息（PID、env、内存、退出码）。
- **`child_process`** 模块：创建**子进程**跑外部命令或其它 Node 脚本。
- **`cluster`** 模块：基于 `child_process.fork`，专做**多核 HTTP 服务**。
- **`worker_threads`**：另一种"多线程"方案（用共享内存，不开新进程）。

这一篇聚焦在 **`process` + `child_process`**：什么时候用、怎么用、父子进程怎么通信。

## 二、先用一句话讲清楚

**Node.js 单进程 + 事件循环虽然高效，但 CPU 密集和多核场景需要多进程。`child_process` 提供 `spawn`/`exec`/`execFile`/`fork` 四种方式开子进程；`process` 全局对象让你拿到当前进程的 PID、env、argv、内存、信号。**

## 三、官方文档是怎么说的

[Node.js 中文文档 - 子进程](https://nodejs.cn/api/child_process.html) 开篇：

> `child_process` 模块提供了以**与 popen(3) 类似但不完全相同**的方式产生子进程的能力。该能力主要由 [`child_process.spawn()`](https://nodejs.cn/api/child_process.html#child_processspawncommand-args-options) 函数提供。
>
> 其它函数 [`child_process.exec()`](https://nodejs.cn/api/child_process.html#child_processsynccommand-options)、[`child_process.execFile()`](https://nodejs.cn/api/child_process.html#child_processexecfilefile-args-options-callback) 和 [`child_process.fork()`](https://nodejs.cn/api/child_process.html#child_processforkmodulepath-args-options) 都是为满足**更特定的需求**而构建的。

补充理解（不在原文）：

- **`spawn`** 是**底层 API**：直接对应 `posix_spawn`，**流式**获取 stdout/stderr，**效率最高**。
- **`exec`**：开 shell 跑命令，把输出**一次性**放到内存里返回（**有最大输出限制**）。
- **`execFile`**：和 `exec` 类似，**但不开 shell**，更安全（防命令注入）。
- **`fork`**：**专门**用来跑另一个 Node.js 脚本，**自带 IPC 通道**（父子能直接 `send` 消息）。

## 四、换成人话怎么理解

把"进程"想象成**一个工厂**：

- **主进程** = 你所在的总厂。
- **子进程** = 你外包出去的分厂、协作厂。

四种开子进程的方式：

- **`spawn`**：**直接开厂**，告诉你"我开了 ID=1234 的厂在跑，它在说话（stdout）你直接听它的管道"。最灵活、最省内存。
- **`exec`**：**让秘书帮你开厂**，秘书会等厂**干完活**再给你一份"工作汇报"（stdout 拼成字符串）。简单，但**输出大了会爆**。
- **`execFile`**：和 `exec` 类似，但**不让秘书用 shell**，直接传命令和参数。**更安全**。
- **`fork`**：**专门开"Node.js 分厂"**，两个厂之间有**专用电话线（IPC）**，可以直接打电话（`send`/`on('message')`）。

`process` 则是**你这个"主厂"的控制台**——能看到自己的工号（PID）、通讯录（env）、门窗（stdin/stdout）、紧急出口（exit）等。

## 五、最小可运行示例

### 5.1 process 全局对象

```js
// process-info.mjs
console.log('PID:        ', process.pid);
console.log('Platform:   ', process.platform);    // 'linux' | 'darwin' | 'win32'
console.log('Node 版本:   ', process.version);
console.log('CWD:        ', process.cwd());
console.log('命令行参数:   ', process.argv);
console.log('内存占用:    ', process.memoryUsage());
console.log('环境变量 NODE_ENV:', process.env.NODE_ENV);
console.log('uptime:     ', process.uptime());
```

```text
PID:         12345
Platform:    linux
Node 版本:    v20.10.0
CWD:         /home/joekma/myapp
命令行参数:    [ 'node', '/path/to/process-info.mjs' ]
内存占用:     { rss: 30..., heapTotal: 6..., heapUsed: 5... }
uptime:      0.005
```

### 5.2 spawn：流式执行命令

```js
// spawn-demo.mjs
import { spawn } from 'node:child_process';

const ls = spawn('ls', ['-la', 'src/'], { encoding: 'utf8' });

ls.stdout.on('data', (chunk) => console.log('OUT:', chunk));
ls.stderr.on('data', (chunk) => console.error('ERR:', chunk));
ls.on('close',   (code) => console.log('退出码：', code));
ls.on('error',   (err)  => console.error('启动失败：', err));
```

**逐行解释：**

- `spawn(cmd, args, options)`：开子进程跑命令。**args 必须传数组**，**防命令注入**。
- `ls.stdout` / `ls.stderr`：子进程的**输出流**（Readable），可以 `pipe` 到任何 Writable。
- `close` 事件：进程退出，参数是退出码（0 = 成功）。
- 不开 shell，**比 `exec` 安全**。

### 5.3 exec：一次拿全部输出

```js
// exec-demo.mjs
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execP = promisify(exec);

try {
  const { stdout, stderr } = await execP('ls -la src/', { encoding: 'utf8' });
  console.log('stdout:', stdout);
  if (stderr) console.error('stderr:', stderr);
} catch (err) {
  console.error('执行失败：', err.message);
}
```

> **坑：** exec 默认 `maxBuffer` = 1 MB。输出大文件可能 `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`。
>
> `exec` 会**开 shell**（`/bin/sh -c`），意味着 `;`、`&&`、管道都生效——**也意味着能注入命令**，永远别用 `exec` 跑用户输入。

### 5.4 execFile：不走 shell

```js
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

try {
  const { stdout } = await execFileP('node', ['-e', 'console.log(process.versions)'], {
    encoding: 'utf8',
  });
  console.log(stdout);
} catch (err) {
  console.error(err);
}
```

> **比 `exec` 安全**：不会触发 shell 解析，参数安全转义。

### 5.5 fork：父子进程通过 IPC 通信

**父进程**（`parent.mjs`）：

```js
import { fork } from 'node:child_process';

const child = fork('./child.mjs');

child.on('message', (msg) => {
  console.log('父进程收到：', msg);
  if (msg.type === 'done') child.kill();
});

child.send({ type: 'start', payload: { x: 1, y: 2 } });
```

**子进程**（`child.mjs`）：

```js
process.on('message', (msg) => {
  if (msg.type === 'start') {
    const { x, y } = msg.payload;
    const result = x + y;
    process.send({ type: 'done', payload: { result } });
  }
});
```

**逐行解释：**

- `fork(modulePath)`：开一个**新的 Node.js 进程**跑指定脚本，**自带 IPC 通道**。
- `child.send(data)` / `process.on('message', fn)`：父子进程**双向发送 JS 对象**（会被结构化克隆）。
- **不用 stdin/stdout** 来传数据——它们是默认连到父进程的。

### 5.6 实战：调用 ffmpeg 压缩视频

```js
// compress.mjs
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';

const input  = 'big.mov';
const output = 'small.mp4';

const ffmpeg = spawn('ffmpeg', [
  '-i', input,
  '-vcodec', 'libx264',
  '-crf', '28',
  '-preset', 'medium',
  output,
]);

// 实时打印进度（ffmpeg 把进度写到 stderr）
ffmpeg.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  const match = text.match(/time=(\d+):(\d+):(\d+)/);
  if (match) console.log('当前处理到：', match[0]);
});

ffmpeg.on('close', async () => {
  const inInfo  = await stat(input);
  const outInfo = await stat(output);
  console.log(`压缩完成：${(inInfo.size / 1024 / 1024).toFixed(1)}MB → ${(outInfo.size / 1024 / 1024).toFixed(1)}MB`);
});
```

> 这种"spawn 一个外部 CLI + 监听 stdout/stderr + 写文件"的模式非常常见，**Node.js 写"胶水代码"**就是干这个的。

### 5.7 cluster：多核 HTTP 服务

```js
// cluster.mjs
import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';

if (cluster.isPrimary) {
  const cpus = os.cpus().length;
  console.log(`主进程 ${process.pid} 启动，分出 ${cpus} 个 worker`);
  for (let i = 0; i < cpus; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} 退出，code=${code} signal=${signal}`);
    cluster.fork();                       // 挂了就重启
  });
} else {
  http.createServer((req, res) => {
    res.end(`Hello from worker ${process.pid}\n`);
  }).listen(3000);
  console.log(`worker ${process.pid} 已启动`);
}
```

> 现代 Node.js 项目**一般用 PM2 / clusterd / Kubernetes** 来做多进程，**而不是手写 cluster**。但理解原理能让你看懂运维配置。

## 六、实际项目中怎么用

| 场景 | 用什么 | 原因 |
| ---- | ------ | ---- |
| **调用 ffmpeg、imagemin、git、curl** | `spawn` / `execFile` | 流式、不爆内存 |
| **跑 Node 脚本**（定时任务、worker） | `fork` | 自带 IPC |
| **多核 HTTP 服务** | `cluster` / PM2 | 充分利用 CPU |
| **隔离 CPU 密集任务** | `worker_threads` | 共享内存，比 fork 轻量 |
| **把命令输出实时转发到 HTTP 响应** | `spawn` + `pipe(res)` | 流式推送 |
| **跨语言调用** | `spawn` / `execFile` | Python/Go/Shell 都能调 |
| **CLI 工具** | `child_process.spawn` | 像 npm/yarn 那样 fork 工具子进程 |

补充理解（不在原文）——**安全跑用户命令**：

```js
// ❌ 危险
exec(`ls ${userInput}`);            // 用户输入 "x; rm -rf /" 直接炸

// ✅ 安全
execFile('ls', [userInput]);        // 参数化，不会触发 shell 注入
```

## 七、常见误区

### 误区 1：用 `exec` 跑用户输入

- **错在哪里**：`exec(\`grep ${pattern} file\`)`。
- **为什么会错**：`exec` 走 shell，`pattern` 里有 `;` `&&` 就会注入任意命令。
- **正确写法**：用 `execFile` + 数组参数；或用 `spawn` + 数组参数。

### 误区 2：`exec` 输出大文件爆掉

- **错在哪里**：`exec('cat huge.log')` 拿 stdout。
- **为什么会错**：默认 `maxBuffer` 1 MB，超过抛 `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`。
- **正确写法**：
  - **用 `spawn`**：输出是流，**没上限**。
  - 或 `exec(cmd, { maxBuffer: 100 * 1024 * 1024 })`（**不推荐**）。
  - 或 `exec(cmd, { encoding: 'buffer' })` 自己处理。

### 误区 3：fork 后没 `kill`

- **错在哪里**：fork 出去跑长任务，父进程结束但子进程**孤儿化**。
- **为什么会错**：父进程不显式 `kill`，子进程可能不被回收。
- **正确写法**：
  - 父进程监听 `SIGINT`/`exit`：
    ```js
    const child = fork('./worker.mjs');
    process.on('exit', () => child.kill());
    process.on('SIGINT', () => { child.kill(); process.exit(0); });
    ```
  - 或在子进程里监听 `disconnect` 事件自行退出。

### 误区 4：以为 `cluster.fork()` 是线程

- **错在哪里**：以为 worker 共享内存。
- **为什么会错**：每个 worker 是**独立 Node 进程**，**独立内存**。要通信必须 `process.send` / `process.on('message')`。
- **正确理解**：要共享内存用 `worker_threads`；要进程隔离用 `cluster`/`fork`。

### 误区 5：监听不到 `exit` 事件

- **错在哪里**：
  ```js
  child.on('exit', (code) => console.log('done', code));
  child.kill();        // 立刻 SIGTERM
  ```
- **为什么会错**：默认 `kill` 发 `SIGTERM`，子进程可能**忽略**它继续跑。
- **正确写法**：
  ```js
  child.kill('SIGKILL');    // 强杀
  // 或在子进程里处理 SIGTERM 优雅退出
  ```

## 八、和相似概念的区别

| 概念 | 是什么 | 关键差异 |
| ---- | ------ | -------- |
| **process（当前进程）** | 进程内 `global` 对象 | 看/控制**自己** |
| **child_process.spawn** | 开子进程跑任意命令 | **流式** stdout/stderr |
| **child_process.exec** | spawn + **开 shell** | 一次性拿全部输出，**有最大缓冲** |
| **child_process.execFile** | spawn + **不开 shell** | **安全**，推荐 |
| **child_process.fork** | spawn + **Node 专用** + IPC | 父子可 `send` 消息 |
| **worker_threads** | Node 多线程 | **共享内存**（SharedArrayBuffer），不通信 |
| **cluster** | fork 的封装 | 专做多核 HTTP |
| **Promise/async** | 单进程内的"并发" | **不开新进程**，不开销 |

## 九、小结

1. `process` 是**当前进程**的全局对象：PID、env、argv、memoryUsage、stdin/stdout、信号。
2. 开子进程**四件套**：
   - **`spawn`**：最底层，流式输出，**推荐**。
   - **`exec`**：开 shell，**别跑用户输入**。
   - **`execFile`**：不开 shell，**安全**。
   - **`fork`**：跑 Node 脚本，**自带 IPC**。
3. **`send` / `on('message')`** 是父子进程通信的方式，**结构化克隆**支持绝大多数 JS 值（**不能传函数**）。
4. **`cluster`** 是多核 HTTP 的标准方案，但生产用 PM2/K8s 更省心。
5. 子进程**必须显式 kill** 或在 `disconnect` 事件退出，否则可能僵尸化。

---

下一篇我们将进入**实战**——**13-实战：搭建一个完整的 RESTful API**（Express + 中间件 + 鉴权 + 文件上传 + 错误处理），把前 12 篇所有知识串起来。
