---
title: Stream 流式处理：大文件与背压机制
author: Joekma
pubDatetime: 2026-06-01T00:00:00.000+08:00
modDatetime: 2026-06-01T00:00:00.000+08:00
slug: nodejs-stream-backpressure
description: '深入 Node.js Stream：四种流（Readable/Writable/Duplex/Transform）、pipe、pipeline、背压机制、object mode 与 Web Streams，附 GB 级文件复制实战。'
tags:
  - Node.js
  - Stream
  - 背压
  - 大文件
draft: false
series: Node.js 深入浅出
seriesOrder: 10
language: zh-CN
---

## 一、这篇文章要解决什么问题

上一篇讲事件循环时提到过：**CPU 密集会卡死事件循环**。其实还有一个更隐蔽的杀手——**"一次性把大文件读进内存"**。

真实场景里你会遇到：

- 复制一个 5 GB 的视频文件，`fs.readFile` 一下爆掉内存；
- 下载一个 1 GB 的文件，服务器端 `res.end(buffer)` 把内存吃光；
- 处理 1000 万行的 CSV 业务日志，**不能一行行读因为太慢**；
- 视频转码：一边读源文件，一边传给 ffmpeg，一边写结果文件。

这些问题都靠 **Stream（流）** 解决。流是 Node.js 处理"边读边处理"场景的统一抽象，也是 fs、http、net、crypto、zlib 等模块的底层共同语言。

## 二、先用一句话讲清楚

**Node.js 的 Stream 是一种"分块（chunk）传递数据"的接口：Readable 是"可读流"、Writable 是"可写流"、Duplex 是"双工流"、Transform 是"转换流"；用 `pipe()` 或 `pipeline()` 把它们连起来就形成"管道"，自动处理背压。**

## 三、官方文档是怎么说的

[Node.js 中文文档 - Stream](https://nodejs.cn/api/stream.html) 开篇定义：

> 流是用于在 Node.js 中处理流式数据的抽象接口。`stream` 模块提供了一些 API，用于构建实现了流接口的对象。
>
> Node.js 提供了许多流对象。例如，[`http`](https://nodejs.cn/api/http.html) 服务器的请求和 [`process.stdout`](https://nodejs.cn/api/process.html#processstdout) 都是流的实例。
>
> 流可以是**可读的**、**可写的**，或者是**可读可写的**。所有流都是 [`EventEmitter`](https://nodejs.cn/api/events.html) 的实例。

补充理解（不在原文）：

- **背压（backpressure）**：当写入速度跟不上读取速度时，**Writable 内部会向 Readable 发出"暂停"信号**。这是流的内置机制。
- 几乎所有 I/O 在 Node.js 里**都是流**：`fs.createReadStream`、`fs.createWriteStream`、`net.Socket`、`http.IncomingMessage`、`http.ServerResponse`、`process.stdin`、`process.stdout`、`zlib` 压缩流……

## 四、换成人话怎么理解

把"流"想象成**水管**：

- **`Readable`** = **水龙头**。有水（数据）的时候可以"流出来"，按 `data` 事件一段一段给你。
- **`Writable`** = **下水道**。你可以一段一段往里"倒水"。
- **`Duplex`** = **双向水管**。可读可写（如 TCP socket）。
- **`Transform`** = **净水器**。水进来后被处理（比如压缩、加密），再流出去。
- **`pipe()`** = **把水龙头接上下水道**。读一段、写一段、自动调节速度。
- **背压** = **下水道堵了**。水龙头会自动**关小**，等下水道消化完再开。

读取 1 GB 文件 = 把它分成 64 KB 的小份**一段段读**。处理 1 GB 文件 = 读一段、处理一段、写一段，**永远只占 ~64 KB 内存**。

## 五、最小可运行示例

### 5.1 第一个流式复制

```js
// copy.mjs
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const src = 'big-video.mp4';
const dest = 'big-video-copy.mp4';

try {
  await pipeline(
    createReadStream(src),
    createWriteStream(dest)
  );
  console.log('拷贝完成');
} catch (err) {
  console.error('拷贝失败：', err);
}
```

**逐行解释：**

- `createReadStream(src)`：返回一个 **`Readable` 流**，一边从磁盘读数据、一边 emit `'data'` 事件。
- `createWriteStream(dest)`：返回一个 **`Writable` 流**，把收到的数据写进文件。
- `pipeline(...streams)`：**官方推荐**的"管道"函数。它会**自动处理背压**和**错误传播**，结束后给出 Promise。
- 如果用 `.pipe()`，**你必须自己监听 `error` 事件**，否则一个流的错误会让另一个流"卡住"。

### 5.2 边读边处理：行式处理 CSV

```js
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

async function processLogFile(path) {
  const stream = createReadStream(path, { encoding: 'utf8' });

  // readline 提供"按行读"的接口
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo++;
    if (line.includes('ERROR')) {
      console.log(`第 ${lineNo} 行错误：${line}`);
    }
  }
  console.log(`处理完成，共 ${lineNo} 行`);
}

await processLogFile('app.log');
```

> `for await (const line of rl)` 是现代写法，**自动处理背压**（不再 emit 'data'）。

### 5.3 写一个 Transform：日志中"脱敏"手机号

```js
// mask.mjs
import { Transform } from 'node:stream';

export class PhoneMask extends Transform {
  constructor() {
    super({ decodeStrings: false });
  }

  _transform(chunk, _encoding, callback) {
    const masked = chunk.toString().replace(
      /1[3-9]\d{9}/g,
      (m) => m.slice(0, 3) + '****' + m.slice(7)
    );
    callback(null, masked);
  }
}
```

```js
// 使用
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { PhoneMask } from './mask.mjs';

await pipeline(
  createReadStream('user-actions.log', { encoding: 'utf8' }),
  new PhoneMask(),
  createWriteStream('user-actions.masked.log')
);
```

**关键点：**

- **Transform** 是 **Duplex** 的子类，自己实现 `_transform(chunk, encoding, cb)`。
- 第一个参数是输入的 chunk（Buffer 或 string，取决于 `decodeStrings`）。
- **必须**调用 `callback(null, transformedChunk)` 让下一段流拿到数据。
- `decodeStrings: false` 让 chunk 保持 string 形式，免去 `.toString()`。

### 5.4 手动控制流：暂停、恢复、背压

```js
// manual.mjs
import { createReadStream } from 'node:fs';

const stream = createReadStream('big.log', { highWaterMark: 64 * 1024 });

stream.on('data', (chunk) => {
  console.log('收到 chunk：', chunk.length, 'bytes');
  stream.pause();                  // 暂停
  setTimeout(() => stream.resume(), 100);  // 100ms 后再读
});
```

> `highWaterMark` 是"缓冲区大小"，默认 64 KB。**写入方满了就会让读取方暂停**——这就是背压。

### 5.5 object mode：传 JS 对象而不是 Buffer

```js
// obj-stream.mjs
import { Readable, Writable } from 'node:stream';

const source = Readable.from(
  (async function* () {
    yield { id: 1, name: 'A' };
    yield { id: 2, name: 'B' };
    yield { id: 3, name: 'C' };
  })(),
  { objectMode: true }
);

source.on('data', (obj) => console.log(obj));
```

> 用 `Readable.from(asyncGenerator)` 可以在流里传任意对象，配合 `pipeline` + 自定义 `Transform` 做"对象流水线"（如 RxJS 风格的数据处理）。

### 5.6 Web Streams（Node.js 16.5+）

```js
// web-streams.mjs
import { ReadableStream, WritableStream } from 'node:stream/web';

const readable = new ReadableStream({
  start(controller) {
    controller.enqueue('hello');
    controller.enqueue('world');
    controller.close();
  },
});

const writable = new WritableStream({
  write(chunk) {
    console.log('写：', chunk);
  },
});

await readable.pipeTo(writable);
```

> Web Streams API **和浏览器一致**，在 `fetch`、`Response`、Service Worker 等场景天然互通。Node.js 18+ 起 `fetch` 返回的就是 Web Streams 风格的 `Response`。

## 六、实际项目中怎么用

| 场景 | 用流 | 原因 |
| ---- | ---- | ---- |
| **大文件复制 / 移动** | `createReadStream` + `createWriteStream` | 不爆内存 |
| **静态资源服务** | `fs.createReadStream` + `res` | 边读边发，内存稳定 |
| **大文件上传到 OSS** | `fs.createReadStream` → `oss.putStream` | 流式上传，断点续传 |
| **日志处理** | `readline` + `Transform` | 按行处理，自动背压 |
| **视频转码** | `child_process.spawn('ffmpeg')` + `pipe` | 进程间流式通信 |
| **HTTP 请求体** | `req`（Readable） | `for await (const chunk of req)` |
| **HTTP 响应体** | `res`（Writable） | `res.write(chunk); res.end()` |
| **压缩/解压** | `zlib.createGzip`（Transform） | 管道中间件 |
| **加密/解密** | `crypto.createCipheriv`（Transform） | 流式加密大文件 |

补充理解（不在原文）—— 一个常见的"日志处理管道"：

```js
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

// read  →  按行切分  →  过滤 ERROR  →  gzip 压缩  →  写文件
await pipeline(
  createReadStream('access.log', { encoding: 'utf8' }),
  createLineFilter('ERROR'),
  createGzip(),
  createWriteStream('errors.log.gz')
);
```

每一段都是"流"，**内存始终恒定**。

## 七、常见误区

### 误区 1：用 `fs.readFile` 读大文件

- **错在哪里**：`const buf = await readFile('big.mp4')`。
- **为什么会错**：5 GB 文件 = 5 GB 内存，**直接 OOM**。
- **正确写法**：用 `createReadStream` 分块读，或者用 `fs.createReadStream(path, { highWaterMark: 1 * 1024 * 1024 })` 调大块大小。

### 误区 2：用 `.pipe()` 但不监听 `error`

- **错在哪里**：
  ```js
  createReadStream('x').pipe(createWriteStream('y'));  // 读失败就静默
  ```
- **为什么会错**：流的错误是**事件**，`pipe` 不会自动传播。一个流出错会**卡住另一个流**。
- **正确写法**：**永远用 `pipeline()`**，自动传播错误和清理资源。

### 误区 3：在 `'data'` 事件里 await 异步操作

- **错在哪里**：
  ```js
  stream.on('data', async (chunk) => {
    await uploadToS3(chunk);  // 慢操作，stream 已经 push 更多数据进缓冲
  });
  ```
- **为什么会错**：`data` 事件不会等你的 `await` 完成，**背压失效**，内存堆积。
- **正确写法**：用 `for await (const chunk of stream)`（自动应用背压），或者在 `'data'` 里检查 `stream.write()` 的返回值（false 时 `pause()`）。

### 误区 4：忘了 `res.end()`

- **错在哪里**：
  ```js
  res.write(head);
  res.write(body);
  // 漏了 res.end()
  ```
- **为什么会错**：客户端一直等不到响应结束，连接挂着。
- **正确写法**：用 `pipeline(readStream, res)`，**`pipeline` 会自动 `res.end()`**。

### 误区 5：把流当成 Promise

- **错在哪里**：`await createReadStream('x')`。
- **为什么会错**：流**不是 Promise**，没有 `then`。
- **正确写法**：
  ```js
  for await (const chunk of createReadStream('x')) { ... }
  // 或
  await pipeline(createReadStream('x'), destination);
  ```

## 八、和相似概念的区别

| 概念 | 是什么 | 关键差异 |
| ---- | ------ | -------- |
| **`fs.readFile`** | **一次性**把文件全读进内存 | 简单，但**不能处理大文件** |
| **Readable 流** | **分块**读，事件/异步迭代消费 | 可处理 GB 级文件 |
| **`.pipe()`** | 老式"插管" | 不会传播 error，要自己监听 |
| **`pipeline()`** | 现代"插管" | 自动背压 + 错误传播 + 清理 |
| **`for await` 消费** | 现代写法 | 写法最自然，自动背压 |
| **Web Streams** | 浏览器/Node 18+ 通用流 | 跨端一致，但和 Node Streams 互不通用 |
| **RxJS** | 第三方响应式库 | 操作符丰富，但和原生流不互通 |

## 九、小结

1. Node.js 的 **Stream** = 分块读写数据的接口，**所有大文件 / 网络 / 进程通信都用它**。
2. 四种流：**Readable**（读）、**Writable**（写）、**Duplex**（读写）、**Transform**（读+处理+写）。
3. 拼接流用 **`pipeline()`**，**不要用 `.pipe()`**——前者自动处理背压、错误传播、资源清理。
4. **消费流**用 `for await` 或 `'data'` 事件（前者更现代，自动背压）。
5. 小文件用 `readFile`/`writeFile`；**大文件、HTTP body、压缩、加密、日志处理一律用流**。

---

下一篇我们将学习 **11-Buffer 与编码：处理二进制数据**——搞懂字符串、Buffer、字符编码（UTF-8、Base64、Hex）的关系，以及图片、网络包、加密场景的处理。
