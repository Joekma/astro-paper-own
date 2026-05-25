---
title: WebSocket 协议原理和使用方法
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: websocket-tutorial
description: 'WebSocket协议原理和使用方法。'
tags:
  - WebSocket
  - 网络
  - 实时通信
  - Web
draft: false
series: 网络
seriesOrder: 20
language: zh-CN
---

## 概述

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。与传统 HTTP 轮询相比，WebSocket 提供真正的双向实时通信能力。

## HTTP vs WebSocket

| 特性 | HTTP | WebSocket |
|------|------|-----------|
| 连接方式 | 请求-响应 | 持久连接 |
| 通信方向 | 半双工 | 全双工 |
| 服务器推送 | 不支持 | 支持 |
| 资源开销 | 每次请求都创建新连接 | 一次握手，持续通信 |
| 数据格式 | 请求/响应格式 | 帧格式 |

## 连接建立过程

```
┌─────────┐                      ┌─────────┐
│  客户端  │                      │  服务器  │
└────┬────┘                      └────┬────┘
     │                                │
     │── HTTP GET + Upgrade ─────────▶│
     │                                │
     │◀─── 101 Switching Protocols ──│
     │                                │
     │◀══════════ WebSocket 连接 ═══════════▶│
     │     (全双工通信)                │
     │                                │
```

### 握手请求

```http
GET /ws HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Origin: http://example.com
```

### 握手响应

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

## JavaScript 客户端

### 基本使用

```javascript
const ws = new WebSocket('ws://example.com/ws');

ws.onopen = () => {
    console.log('连接已建立');
    ws.send('Hello Server');
};

ws.onmessage = (event) => {
    console.log('收到消息:', event.data);
};

ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
};

ws.onclose = () => {
    console.log('连接已关闭');
};
```

### 心跳机制

```javascript
class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.timer = null;
        this.interval = 30000;
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('连接成功');
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            if (event.data === 'pong') return;
            this.handleMessage(event.data);
        };
    }

    startHeartbeat() {
        this.timer = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
            }
        }, this.interval);
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    close() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        if (this.ws) {
            this.ws.close();
        }
    }
}
```

### 自动重连

```javascript
class ReconnectingWebSocket {
    constructor(url, options = {}) {
        this.url = url;
        this.reconnectInterval = options.reconnectInterval || 1000;
        this.maxReconnectInterval = options.maxReconnectInterval || 30000;
        this.reconnectDecay = options.reconnectDecay || 1.5;
        this.reconnectAttempts = options.reconnectAttempts || Infinity;
        this.readyState = WebSocket.CONNECTING;
        this.attempts = 0;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.readyState = WebSocket.OPEN;
            this.attempts = 0;
        };

        this.ws.onclose = (event) => {
            this.readyState = WebSocket.CLOSED;
            this.reconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 错误');
        };
    }

    reconnect() {
        if (this.attempts < this.reconnectAttempts) {
            this.attempts++;
            const delay = Math.min(
                this.reconnectInterval * Math.pow(this.reconnectDecay, this.attempts - 1),
                this.maxReconnectInterval
            );

            setTimeout(() => {
                this.connect();
            }, delay);
        }
    }

    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }
}
```

## Python 服务端

### 使用 asyncio

```python
import asyncio
import websockets

async def echo(websocket, path):
    async for message in websocket:
        await websocket.send(f"Echo: {message}")

asyncio.get_event_loop().run_until_complete(
    websockets.serve(echo, 'localhost', 8765)
)
asyncio.get_event_loop().run_forever()
```

### 使用 Flask-SocketIO

```python
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('message')
def handle_message(message):
    print(f'收到消息: {message}')
    emit('response', {'data': f'收到: {message}'})

@socketio.on('connect')
def handle_connect():
    print('客户端已连接')

@socketio.on('disconnect')
def handle_disconnect():
    print('客户端已断开')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
```

### 消息帧格式

```python
# WebSocket 帧结构
# 0                   1                   2                   3
# 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
# +-+-+-+-+-------+-+-------------｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜
# |F|R|R|R|  opcode   |M|     payload len     │    extended payload length    │             masking key                │
# +-+-+-+-+-------+-+-------------｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜｜
# |                             payload                              │
# +─────────────────────────────────────────────────────────────────┘

# opcode 类型
0x0: 延续帧
0x1: 文本帧
0x2: 二进制帧
0x8: 关闭帧
0x9: Ping
0xA: Pong
```

## 应用场景

| 场景 | 说明 |
|------|------|
| **实时聊天** | 在线客服、即时通讯 |
| **实时协作** | 多人文档编辑、协同白板 |
| **实时通知** | 系统消息推送 |
| **在线游戏** | 实时游戏、弹幕 |
| **金融行情** | 股票、加密货币实时报价 |
| **IoT 监控** | 设备状态实时监控 |

## Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;

    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600;
    }
}
```

## 安全考虑

### 验证来源

```python
# 服务端验证 Origin
allowed_origins = ['https://example.com', 'https://www.example.com']

def validate_origin(origin):
    return origin in allowed_origins

# 握手时检查
if not validate_origin(request.origin):
    return 403
```

### 消息验证

```python
import json
import hashlib

class MessageValidator:
    def __init__(self, secret):
        self.secret = secret

    def sign(self, data):
        message = json.dumps(data)
        signature = hashlib.sha256(
            (message + self.secret).encode()
        ).hexdigest()
        return {
            **data,
            'signature': signature
        }

    def verify(self, data):
        signature = data.pop('signature', None)
        if not signature:
            return False

        expected = self.sign(data)['signature']
        return signature == expected
```

### 限流

```python
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_messages=100, window=60):
        self.max_messages = max_messages
        self.window = window
        self.clients = defaultdict(list)

    def is_allowed(self, client_id):
        now = time.time()
        client_messages = self.clients[client_id]

        # 清理过期记录
        self.clients[client_id] = [
            t for t in client_messages
            if now - t < self.window
        ]

        if len(self.clients[client_id]) >= self.max_messages:
            return False

        self.clients[client_id].append(now)
        return True
```

## 小结

WebSocket 核心要点：

- **全双工通信**：客户端和服务器可同时发送消息
- **持久连接**：一次握手，持续通信
- **低延迟**：服务端可主动推送
- **心跳机制**：保持连接活跃
- **自动重连**：网络中断时自动恢复