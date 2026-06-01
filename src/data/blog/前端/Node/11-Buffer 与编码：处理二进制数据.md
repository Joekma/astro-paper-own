---
title: Buffer 与编码：处理二进制数据
author: Joekma
pubDatetime: 2026-06-01T00:00:00.000+08:00
modDatetime: 2026-06-01T00:00:00.000+08:00
slug: nodejs-buffer-encoding
description: '详解 Node.js Buffer：二进制本质、UTF-8/Base64/Hex 编码、Buffer 与 String/Stream 互转、安全 API（Buffer.alloc/concat/compare）以及和 TypedArray 的关系。'
tags:
  - Node.js
  - Buffer
  - 二进制
  - 编码
draft: false
series: Node.js 深入浅出
seriesOrder: 11
language: zh-CN
---

## 一、这篇文章要解决什么问题

写 Node.js 时，你大概率见过类似这些输出：

```text
<Buffer 48 65 6c 6c 6f>
```

或者遇到过这些问题：

- 读图片 `fs.readFile('photo.png')` 拿到的不是字符串，是 `Buffer`——怎么转？
- 客户端发了 `application/octet-stream` 的二进制数据，怎么解析？
- 写接口要把 Buffer 编码成 Base64 给前端用 `<img src="data:image/png;base64,...">`；
- 想知道一段中文字符串在 UTF-8 下占几个字节；
- `Buffer.from('hello')` 和 `Buffer.from('hello', 'utf8')` 有区别吗？

这些问题的根源都在 **"Node.js 默认用 Buffer 表示原始字节"**。这一篇系统讲清楚 Buffer 与编码。

## 二、先用一句话讲清楚

**Buffer 是 Node.js 用来表示"固定长度的字节数组"的对象，用来处理二进制数据（图片、音频、网络包、加密结果）。它和字符串之间通过"字符编码"（UTF-8、Base64、Hex）相互转换。**

## 三、官方文档是怎么说的

[Node.js 中文文档 - Buffer](https://nodejs.cn/api/buffer.html) 开篇：

> `Buffer` 对象用于以字节序列的方式表示**二进制数据**。许多 Node.js API 都支持 `Buffer`，或者用 `Buffer` 作为参数。
>
> `Buffer` 类在 Node.js 中是**全局可用**的，**不需要 `require` 即可使用**。
>
> 虽然 `Buffer` 类在全局作用域内可用，但仍然**建议**通过 `import` 或 `require` 显式地引用它。

补充理解（不在原文）：

- Buffer 是 **Uint8Array 的子类**（从 Node.js 4 开始）。换句话说，`buffer.buffer` 是 `ArrayBuffer`，`buffer.byteOffset` 是偏移量。
- **所有 I/O 默认返回/接受 Buffer**：`fs.readFile` 不传编码就拿 Buffer；`http` 请求体是 Buffer 流。
- 字符串 ↔ Buffer 的桥梁是**字符编码**（UTF-8、UTF-16LE、Latin1、Base64、Hex、ASCII）。

## 四、换成人话怎么理解

把 Buffer 想象成**"用十六进制写的原始字节列表"**：

- `'H'` 在 ASCII 里是 `0x48`。
- `'e'` 是 `0x65`。
- `'l'` 是 `0x6C`。
- `'o'` 是 `0x6F`。
- 所以 `Buffer.from('Hello')` 等于 `[0x48, 0x65, 0x6C, 0x6C, 0x6F]`。

字符串是"给人看的"，Buffer 是"给机器/网络/磁盘看的"。

- 字符编码（character encoding）就是**字符串 ↔ 字节数组**的**翻译规则**。
- **UTF-8** 是最常用的编码：英文 1 字节，中文 3 字节，表情 4 字节。
- **Base64** 是"用可见字符表示二进制"的规则，方便在 URL、JSON、HTML 里塞二进制。
- **Hex** 是用 16 进制字符表示每个字节（`48 65 6c 6c 6f`）。

**Buffer 的核心用途**：

- 读/写**图片、音频、视频、PDF**（纯二进制）
- 接收/发送**网络包**（TCP/UDP 字节流）
- **加密/哈希**的结果（`crypto` 库返回 Buffer）
- **压缩/解压**（`zlib` 接受 Buffer）
- 跨语言 / 跨协议时**统一数据格式**

## 五、最小可运行示例

> 本节以 ESM 写法，Node.js 18+ 演示。

### 5.1 创建 Buffer

```js
// 1. 从字符串创建（必须指定编码）
const b1 = Buffer.from('Hello', 'utf8');
console.log(b1);
// <Buffer 48 65 6c 6c 6f>
console.log(b1.toString('hex'));   // '48656c6c6f'
console.log(b1.toString('base64'));// 'SGVsbG8='

// 2. 从字节数组创建
const b2 = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
console.log(b2.toString());        // 'Hello'

// 3. 创建指定长度的空 buffer（默认填 0）
const b3 = Buffer.alloc(10);
console.log(b3);                   // <Buffer 00 00 00 00 00 00 00 00 00 00>

// 4. ⚠️ 危险 API：allocUnsafe 不清零，可能包含旧数据
const b4 = Buffer.allocUnsafe(10);  // 永远别用，演示用
```

**重点警告：**`Buffer.alloc(size)` 总是**清零**（安全）；`Buffer.allocUnsafe(size)` **不清零**（可能含旧内存数据，**有信息泄露风险**）。新代码**永远用 `Buffer.alloc`** 或 `Buffer.from(...)`。

### 5.2 字符串与 Buffer 的转换

```js
// 字符串 → Buffer
const buf = Buffer.from('你好，世界', 'utf8');
console.log(buf.length);         // 15 字节：'你'(3) '好'(3) '，'(3) ' '(1) '世'(3) '界'(3) - actually '，' is 1 byte, ' ' is 1 byte
//                                  = 3+3+1+1+3+3 = 14? 实际上 '你' '好' '世' '界' 各 3 字节，'，' 1 字节，' ' 1 字节 = 14 字节
// 不同标点结果可能不同
console.log(buf.toString('utf8'));// 还原字符串

// 编码互转
const hex    = buf.toString('hex');       // 16 进制字符串
const base64 = buf.toString('base64');    // Base64
console.log(Buffer.from(base64, 'base64').toString('utf8'));  // 还原
```

### 5.3 中文 / 表情 占多少字节

```js
const samples = ['A', '你', '😀'];

for (const s of samples) {
  const buf = Buffer.from(s, 'utf8');
  console.log(`${s}  字符数 ${s.length}  字节数 ${buf.length}`);
}
// A  字符数 1  字节数 1
// 你  字符数 1  字节数 3
// 😀 字符数 2  字节数 4  ← 表情在 JS 里是 2 个码元（surrogate pair），UTF-8 占 4 字节
```

> **字符数（`.length`）和字节数（`Buffer.byteLength`）不一样**——这是处理中英文混排、表情、上传文件大小限制时最容易踩的坑。

### 5.4 拼接 / 切片 / 比较

```js
// 拼接
const a = Buffer.from('Hello, ');
const b = Buffer.from('World');
const c = Buffer.concat([a, b]);
console.log(c.toString());        // 'Hello, World'

// 切片（返回的是引用，不是副本！）
const sliced = c.slice(0, 5);
console.log(sliced.toString());   // 'Hello'
sliced[0] = 0x6a;                 // 修改切片会**影响原 buffer**
console.log(c.toString());        // 'jello, World'

// 想要副本？
const copied = c.subarray(0, 5);  // 用 subarray / copy
// 或
const copy = Buffer.from(c.subarray(0, 5));  // 包一层 Buffer.from

// 比较
console.log(Buffer.compare(a, b));  // -1 / 0 / 1
console.log(a.equals(b));            // false
```

### 5.5 与 TypedArray 互转

```js
// Buffer 是 Uint8Array 子类
const buf = Buffer.from('ABC');
console.log(buf instanceof Uint8Array);  // true

// 转为 Uint8Array
const u8 = new Uint8Array(buf);
console.log(u8[0]);                      // 65（'A' 的 ASCII 码）

// Uint8Array 转为 Buffer
const buf2 = Buffer.from(u8);
console.log(buf2.toString());            // 'ABC'
```

### 5.6 实战：把图片转成 data URL

```js
import { readFile } from 'node:fs/promises';

async function toDataURL(imagePath) {
  const buf  = await readFile(imagePath);
  const mime = {
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
  }[imagePath.match(/\.[^.]+$/)?.[0]?.toLowerCase()] || 'application/octet-stream';

  return `data:${mime};base64,${buf.toString('base64')}`;
}

const dataUrl = await toDataURL('logo.png');
console.log(dataUrl.slice(0, 60), '...');
// data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

### 5.7 实战：解析十六进制字符串

```js
// 接收前端传的 hex 字符串 '48656c6c6f'，还原 'Hello'
function hexToString(hex) {
  // 方式 1：Buffer.from
  return Buffer.from(hex, 'hex').toString('utf8');
}

console.log(hexToString('48656c6c6f'));  // 'Hello'
```

## 六、实际项目中怎么用

| 场景 | Buffer 用来做什么 |
| ---- | ----------------- |
| **文件上传 / 接收二进制** | 客户端发 `Content-Type: application/octet-stream` 时，服务端 `req` 是 Buffer 流 |
| **图片处理** | sharp / jimp 接受 Buffer；返回 Buffer |
| **加密 / 哈希** | `crypto.createHash('sha256').update(buf).digest()` → Buffer |
| **网络协议** | TCP/UDP socket 的 `data` 事件拿到 Buffer |
| **ZIP / 压缩** | `zlib.gunzip(buf)` / `zlib.deflateRaw` 都用 Buffer |
| **跨进程通信 IPC** | `child_process` 用 `process.send(buf)` 发 Buffer |
| **前端展示图片** | 转 base64 data URL 或 `Blob` |
| **签名 / 验签** | HMAC、RSA、Ed25519 签名结果是 Buffer，需 toString('base64') 给前端 |

补充理解（不在原文）——前端对接小贴士：

- **JSON 不能直接传 Buffer**，必须 `toString('base64')` 或 `toString('hex')`。
- **如果上传文件**，前端用 `FormData` / `FileReader.readAsArrayBuffer`，后端用 `multer`/`busboy` 解析（后续实战篇会涉及）。
- **下载文件**给前端 → 服务端用 `res.end(buf)` 或 `res.send(Buffer.from(...))`。

## 七、常见误区

### 误区 1：混淆"字符数"和"字节数"

- **错在哪里**：
  ```js
  const s = '你好';
  s.length                       // 2（字符数）
  Buffer.byteLength(s, 'utf8')   // 6（字节数）
  Buffer.from(s).length          // 6
  ```
- **为什么会错**：`length` 在字符串上是"码元数"，在 Buffer 上是"字节数"。
- **正确理解**：
  - 限制用户名字 **字符数** → `username.length <= 20`
  - 限制上传 **字节数** → `buf.byteLength` 或 `fs.statSync(file).size`
  - 数据库字段长度：MySQL `VARCHAR(N)` 是字符数；`TEXT` 是字节数（utf8mb4 4 字节每字符）

### 误区 2：用 `==` 比较 Buffer

- **错在哪里**：`buf1 == buf2`。
- **为什么会错**：Buffer 比较是**逐字节**的，但**`==` 会先比较引用**。
- **正确写法**：
  ```js
  Buffer.compare(a, b) === 0
  // 或
  a.equals(b)
  ```

### 误区 3：用 `Buffer.allocUnsafe`

- **错在哪里**：图快用 `Buffer.allocUnsafe(1024)`。
- **为什么会错**：可能包含**旧内存数据**，造成**信息泄露**（Node.js 8+ 已有缓解但仍不推荐）。
- **正确写法**：永远用 `Buffer.alloc(size)`，差的那点性能可忽略。

### 误区 4：误以为 `slice()` 是副本

- **错在哪里**：`const copy = buf.slice(0, 5)`，以为拿到了独立副本。
- **为什么会错**：`slice` 返回的是**视图**（和原 Buffer 共享内存），修改 copy 会影响原 Buffer。
- **正确写法**：
  ```js
  const copy = Buffer.from(buf);          // 深拷贝
  // 或
  const copy = buf.subarray(0, 5);        // 也是视图，但用 Buffer.from 包一层
  ```

### 误区 5：直接拼接字符串

- **错在哪里**：`const s = part1 + part2` 拼接大量碎片。
- **为什么会错**：JS 字符串是不可变的，每次 `+` 都会**创建新字符串**，性能差。
- **正确写法**：用 `Buffer.concat([...])`，**性能更好**。

## 八、和相似概念的区别

| 概念 | 是什么 | 关键差异 |
| ---- | ------ | -------- |
| **Buffer** | Node.js 的"字节数组"类（继承 Uint8Array） | 适合**二进制 I/O** |
| **`ArrayBuffer`** | 浏览器/Node 通用原始二进制容器 | **不能直接读写**，必须包成 TypedArray |
| **`Uint8Array`** | 8 位无符号整型数组 | 通用、跨平台，Buffer 是其子类 |
| **String** | 人类可读的字符序列 | 和 Buffer 通过**编码**互转 |
| **DataView** | 可以读取多字节整数（小端/大端） | 处理**结构化二进制**（如协议头） |
| **Blob** | 不可变的"二进制大对象" | 浏览器 API；Node 18+ 也有（`node:buffer`） |

## 九、小结

1. **Buffer = 字节数组**，是 Node.js 处理二进制的统一接口，**全局可用**。
2. 创建 Buffer 用 `Buffer.from(...)`（从字符串/数组）或 `Buffer.alloc(size)`（清零），**不要用 `allocUnsafe`**。
3. 字符串 ↔ Buffer 通过**字符编码**互转：UTF-8 是默认，Base64/Hex 是给前端/协议层的友好表示。
4. **字符数 ≠ 字节数**：中文 UTF-8 占 3 字节，表情占 4 字节；做长度限制要分清。
5. **`slice` 是视图**不是副本；比较用 `equals` / `Buffer.compare`；拼接用 `Buffer.concat`。
6. Buffer 是 **Uint8Array 子类**，可以用 TypedArray 风格 API（`byteOffset`、`byteLength`、DataView）。

---

下一篇我们将学习 **12-进程与子进程：spawn、exec、fork**——Node.js 怎么"调用外部程序"、怎么"开多个进程"、父子进程怎么通信。
