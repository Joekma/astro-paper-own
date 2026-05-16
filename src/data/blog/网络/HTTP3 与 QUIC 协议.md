---
title: HTTP/3 与 QUIC 协议
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-05-16T00:00:00Z
slug: http3-quic-protocol
description: 'HTTP/3协议和QUIC传输协议的工作原理、主要特性和实际应用'
tags:
  - HTTP/3
  - QUIC
  - 网络
  - 协议
  - 性能优化
draft: false
series: 网络
language: zh-CN
---

## 概述

HTTP/3 是 HTTP 协议的最新版本，基于 QUIC 传输协议实现。与 HTTP/1.1 和 HTTP/2 不同，HTTP/3 使用 UDP 代替 TCP 作为传输层协议，从而解决了队头阻塞问题，实现了更快的页面加载速度和更好的网络适应性。

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HTTP 协议演进                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   HTTP/1.1 (1999)                                                    │
│   ├── 持久连接 (Keep-Alive)                                         │
│   ├── 管道化 (Pipelining) ── 浏览器支持差                          │
│   └── 问题：串行请求，队头阻塞                                       │
│                                                                      │
│   HTTP/2 (2015)                                                      │
│   ├── 多路复用 ── 解决队头阻塞                                      │
│   ├── HPACK 头部压缩                                                │
│   ├── 服务器推送                                                    │
│   └── 问题：TCP 队头阻塞未解决                                      │
│                                                                      │
│   HTTP/3 (2022)                                                      │
│   ├── QUIC 传输协议 ── 基于 UDP                                     │
│   ├── 0-RTT 连接建立 ── 更快                                        │
│   ├── 连接迁移 ── 网络切换不掉线                                    │
│   └── 问题：彻底解决队头阻塞                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 为什么需要 HTTP/3

### 1.1 HTTP/2 的问题

HTTP/2 虽然解决了 HTTP/1.1 的队头阻塞问题，但由于基于 TCP 协议，仍存在以下问题：

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HTTP/2 TCP 队头阻塞                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Stream 1: ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│   Stream 2: ░░░░░░░░░░░░░███████████████░░░░░░░░░░░░░░░░░░░░░░░░     │
│   Stream 3: ░░░░░░░░░░░░░░░░░░░░░░███████████████░░░░░░░░░░░░░░     │
│                 ↑                                                    │
│                 │                                                   │
│          TCP 丢包导致所有 Stream 等待                               │
│          即使其他 Stream 数据已完整                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 HTTP/3 的改进

HTTP/3 基于 QUIC 协议，彻底解决了队头阻塞问题：

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HTTP/3 QUIC 多路复用                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   QUIC Stream 1:  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │
│   QUIC Stream 2: ░░░░░░░░░░░░░███████████████░░░░░░░░░░░░░░░░░     │
│   QUIC Stream 3: ░░░░░░░░░░░░░░░░░░░░░░███████████████░░░░░░░     │
│                       ↑                                              │
│                       │                                             │
│              Stream 1 丢包只影响 Stream 1                            │
│              其他 Stream 继续传输不受影响                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## QUIC 协议详解

### 2.1 QUIC 是什么

QUIC（Quick UDP Internet Connections）是由 Google 开发的传输协议，基于 UDP 实现，具备以下特性：

- 内置 TLS 1.3 加密
- 多路复用
- 连接迁移
- 0-RTT 连接建立
- 前向纠错
- 连接拥塞控制

### 2.2 QUIC 工作原理

```
┌─────────────────────────────────────────────────────────────────────┐
│                      QUIC 协议架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      HTTP/3                                │   │
│   │                 (应用层)                                     │   │
│   └─────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│   ┌─────────────────────────┴───────────────────────────────────┐   │
│   │                      QUIC                                   │   │
│   │              (传输层 + TLS 集成)                            │   │
│   │                                                              │   │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │   │
│   │  │   Stream   │ │   Stream   │ │   Stream   │               │   │
│   │  │     1      │ │     2      │ │     3      │   (多路复用)  │   │
│   │  └────────────┘ └────────────┘ └────────────┘               │   │
│   │                        │                                    │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │              拥塞控制 & 可靠性                      │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│   ┌─────────────────────────┴───────────────────────────────────┐   │
│   │                        UDP                                   │   │
│   │                    (网络层)                                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 QUIC 头部结构

```
┌────────────────────────────────────────────────────────────────────┐
│                        QUIC 包头结构                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┬──────────────┬───────────────────────────────────┐  │
│  │  Header  │  Connection  │         Packet Number            │  │
│  │   Flag   │      ID      │                                  │  │
│  │ (1 byte) │ (8 bytes)    │       (1-4 bytes可变)            │  │
│  └──────────┴──────────────┴───────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    加密负载数据                             │   │
│  │              (包含 STREAM 帧等)                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 2.4 QUIC 连接建立

```python
# QUIC 连接建立流程（简化版）

class QUICConnection:
    def __init__(self, destination_ip, port):
        self.dest_ip = destination_ip
        self.dest_port = port
        self.connection_id = generate_connection_id()
        self.packet_number = 0

    def connect(self):
        # 1. 发送 Initial 包（包含 TLS Client Hello）
        initial_packet = create_initial_packet(
            connection_id=self.connection_id,
            packet_number=self.packet_number,
            tls_data=generate_tls_client_hello()
        )
        self.send_packet(initial_packet)

        # 2. 接收 Initial Response（包含 TLS Server Hello）
        response = self.receive_packet()
        tls_server_hello = parse_tls_server_hello(response)

        # 3. 发送 Handshake 包（包含 TLS 密钥确认）
        handshake_packet = create_handshake_packet(
            connection_id=self.connection_id,
            packet_number=self.packet_number + 1,
            tls_data=generate_tls_handshake()
        )
        self.send_packet(handshake_packet)

        # 4. 密钥交换完成，开始加密通信
        self.derive_session_keys(tls_server_hello)

        # 5. 发送 0-RTT 数据（如需要）
        if self.can_send_0rtt():
            self.send_0rtt_data()

    def send_packet(self, packet):
        # 使用 UDP 发送
        udp_socket.sendto(packet.serialize(), (self.dest_ip, self.dest_port))

    def receive_packet(self):
        # 接收 UDP 数据
        data, addr = udp_socket.recvfrom(1500)
        return parse_quic_packet(data)
```

## HTTP/3 特性详解

### 3.1 多路复用

HTTP/3 在 QUIC Stream 上实现真正的多路复用，每个 Stream 独立互不影响：

```python
# HTTP/3 多路复用示意

class HTTP3Connection:
    def __init__(self):
        self.streams = {}
        self.quic_connection = None

    def create_stream(self, stream_id):
        stream = HTTP3Stream(stream_id, self.quic_connection)
        self.streams[stream_id] = stream
        return stream

    def send_request(self, method, path, headers, body=None):
        # 为每个请求创建独立 Stream
        stream = self.create_stream(self.next_stream_id())

        # 在独立 Stream 上发送请求
        stream.send_headers(headers)
        if body:
            stream.send_data(body)

        # 响应在相同 Stream 上返回
        return stream.wait_for_response()

class HTTP3Stream:
    def __init__(self, stream_id, quic_conn):
        self.stream_id = stream_id
        self.quic = quic_conn

    def send_headers(self, headers):
        frame = H3Frame(type=H3FrameType.HEADERS, stream=self.stream_id)
        frame.headers = encode_h3_headers(headers)
        self.quic.send_frame(frame)

    def send_data(self, data):
        frame = H3Frame(type=H3FrameType.DATA, stream=self.stream_id)
        frame.data = data
        self.quic.send_frame(frame)

    def wait_for_response(self):
        # 等待此 Stream 的响应
        return self.quic.receive_stream_frames(self.stream_id)
```

### 3.2 0-RTT 连接建立

HTTP/3 支持 0-RTT（Zero Round Trip Time），允许在第一次连接时就开始发送数据：

```
┌─────────────────────────────────────────────────────────────────────┐
│                      1-RTT vs 0-RTT                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1-RTT (首次连接):                                                  │
│                                                                      │
│   Client ────── Initial (ClientHello) ──────────▶ Server           │
│   Client ◀───── Initial (ServerHello) ────────── Server             │
│   Client ────── Handshake (Finished) ──────────▶ Server             │
│   Client ◀═════ Application Data ══════════════ Server             │
│          │                                                      │   │
│          └──────── 1 RTT 延迟 ────────────────────────┘           │
│                                                                      │
│   0-RTT (后续连接):                                                  │
│                                                                      │
│   Client ────── Initial (ClientHello + Early Data) ─▶ Server        │
│   Client ◀═════ Application Data ══════════════════ Server          │
│          │                                                      │   │
│          └──────── 0 RTT 延迟 ────────────────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```python
# 0-RTT 实现示例

class HTTP3Session:
    def __init__(self):
        self.ticket = None  # 存储会话票据

    def load_session(self):
        # 从本地存储加载之前的会话信息
        self.ticket = load_from_storage('http3_session_ticket')
        return self.ticket is not None

    def connect(self):
        if self.ticket:
            # 使用会话票据发起 0-RTT 连接
            packet = create_0rtt_initial_packet(
                connection_id=generate_cid(),
                session_ticket=self.ticket,
                early_data=self.pending_requests  # 提前发送请求数据
            )
        else:
            # 普通 1-RTT 连接
            packet = create_initial_packet(...)

        self.udp_socket.sendto(packet, self.server_address)

        if self.ticket:
            # 立即处理 0-RTT 响应
            return self.process_0rtt_response()
```

### 3.3 连接迁移

QUIC 使用 Connection ID 标识连接，当网络变化时（如 WiFi 切换到 4G），连接可以无缝迁移：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        连接迁移示意                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   手机在 WiFi 环境下建立 QUIC 连接                                    │
│   手机 ──▶ WiFi ──▶ 路由器 ──▶ 服务器                                │
│           Connection ID: 0xABC123                                    │
│                                                                      │
│   切换到 4G 网络后                                                    │
│   手机 ──▶ 4G 基站 ──▶ 路由器 ──▶ 服务器                              │
│           Connection ID: 0xABC123 (保持不变)                         │
│                                                                      │
│   优点：                                                             │
│   - 不需要重新建立连接                                                │
│   - 不需要重新 TLS 握手                                               │
│   - 用户无感知                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```python
# 连接迁移处理

class QUICConnection:
    def on_network_change(self, new_address):
        # 网络变化后，使用相同 Connection ID 继续通信
        self.local_ip = new_address['ip']
        self.local_port = new_address['port']

        # 服务器看到不同 IP，但 Connection ID 相同
        # 认为是同一连接，继续传输数据

        # 拥塞控制状态保持
        self.congestion_controller.notify_migration()

    def receive_packet(self, packet, new_addr=None):
        # 检查是否是迁移的连接
        if new_addr and new_addr != self.current_addr:
            # 连接迁移
            self.current_addr = new_addr
            logger.info(f"Connection migrated to {new_addr}")

        # 正常处理数据包
        return self.process_packet(packet)
```

### 3.4 丢包恢复

QUIC 的丢包恢复比 TCP 更高效：

| 特性 | TCP | QUIC |
|------|-----|------|
| **丢包检测** | 超时 + ACK | ACK + 丢包提示 |
| **重传方式** | 重传整个窗口 | 仅重传丢失数据 |
| **恢复速度** | 较慢 | 快 |
| **对其他流影响** | 影响所有流 | 只影响丢包流 |

```python
# QUIC 丢包恢复示例

class QUICRecovery:
    def __init__(self):
        self.packet_history = {}
        self.ack_eliciting_frames = set()

    def on_packet_sent(self, packet_number, frames):
        # 记录发送的数据包
        self.packet_history[packet_number] = {
            'send_time': time.time(),
            'frames': frames,
            'size': calculate_size(frames)
        }

        # 标记需要确认的包
        if any(is_ack_eliciting(f) for f in frames):
            self.ack_eliciting_frames.add(packet_number)

    def on_acks_received(self, ack_frame):
        largest_acked = ack_frame.largest_acked

        # 标记确认的数据包
        for ack_range in ack_frame.ack_ranges:
            for pn in range(ack_range.start, ack_range.end + 1):
                if pn in self.packet_history:
                    self.packet_history[pn]['acked'] = True

        # 检测丢包
        self.detect_loss(ack_frame)

    def detect_loss(self, ack_frame):
        # 基于 ACK 或超时检测丢包
        for pn in list(self.ack_eliciting_frames):
            if pn < ack_frame.largest_acked - 3:
                # 超过 3 个包未被确认，认为丢包
                self.retransmit(pn)

    def retransmit(self, packet_number):
        # 快速重传丢失的数据包
        packet_info = self.packet_history[packet_number]
        self.send_packet(packet_number, packet_info['frames'])
```

## HTTP/3 帧类型

### 4.1 帧类型列表

| 帧类型 | 值 | 说明 |
|--------|---|------|
| **DATA** | 0x00 | 传输数据 |
| **HEADERS** | 0x01 | 传输 HTTP 头部 |
| **CANONICAL_PRIORITY** | 0x02 | 优先级信息（已移除） |
| **SETTINGS** | 0x04 | 连接设置 |
| **SETTINGS_ACK** | 0x05 | 设置确认 |
| **GOAWAY** | 0x07 | 关闭连接 |
| **PING** | 0x06 | 保持连接活跃 |
| **NEW_TOKEN** | 0x07 | 服务端推送的 token |
| **STREAMS_BLOCKED** | 0x09 | 流被阻塞 |
| **WINDOW_UPDATE** | 0x04 | 流量控制 |
| **GOAWAY** | 0x07 | 关闭连接 |

### 4.2 HEADERS 帧

```python
# QPACK 头部压缩

class QPACKEncoder:
    def __init__(self):
        self.dynamic_table = []
        self.max_table_size = 4096

    def encode(self, headers):
        encoded = []

        for name, value in headers:
            # 检查静态表
            static_index = find_in_static_table(name, value)
            if static_index:
                encoded.append(encode_indexed(static_index))
                continue

            # 检查动态表
            dynamic_index = find_in_dynamic_table(name, value)
            if dynamic_index:
                encoded.append(encode_indexed(dynamic_index + 63))
                continue

            # 新头部
            encoded.append(encode_literal(name, value))
            add_to_dynamic_table(name, value)

        return bytes(encoded)

class QPACKDecoder:
    def __init__(self):
        self.dynamic_table = []

    def decode(self, data):
        headers = []
        stream = BitStream(data)

        while not stream.eof():
            byte = stream.read(8)

            if byte & 0xC0 == 0xC0:  # Indexed
                index = decode_index(byte, stream)
                name, value = self.resolve(index)
                headers.append((name, value))
            elif byte & 0xE0 == 0x20:  # Literal with name reference
                name_idx = byte & 0x1F
                value = stream.read_string()
                name = self.resolve_name(name_idx)
                headers.append((name, value))
            else:  # Literal
                name = stream.read_string()
                value = stream.read_string()
                headers.append((name, value))

        return headers
```

## HTTP/3 客户端实现

### 5.1 使用 curl

```bash
# 使用 curl 测试 HTTP/3

# 检查 curl 是否支持 HTTP/3
curl --version | grep http3

# 强制使用 HTTP/3
curl --http3 https://example.com

# 尝试 HTTP/3，降级到 HTTP/2
curl --http3-only https://example.com

# 显示详细握手信息
curl -v --http3 https://example.com
```

### 5.2 使用 Python (aioquic)

```python
# Python HTTP/3 客户端示例

from aioquic.asyncio import connect
from aioquic.quic.configuration import QuicConfiguration

async def http3_request(url):
    # 配置 QUIC 参数
    config = QuicConfiguration(
        is_client=True,
        alpn_protocols=["h3-29"],  # HTTP/3 草案 29
    )

    # 加载 CA 证书
    config.verify_mode = False  # 测试环境

    async with connect(
        'example.com',
        443,
        configuration=config,
        create_protocol=HTTP3Protocol
    ) as client:
        # 发送 HTTP 请求
        await client.get('/')

        # 等待响应
        response = await client.wait_for_response()
        print(response)

class HTTP3Protocol(asyncio.Protocol):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.streams = {}

    async def get(self, path):
        stream_id = self.get_available_stream_id()

        # 发送请求头
        headers = [
            (':method', 'GET'),
            (':scheme', 'https'),
            (':path', path),
            (':authority', 'example.com'),
            ('user-agent', 'aioquic/0.9'),
        ]
        self.send_headers(stream_id, headers)

        # 发送请求体（GET 请求通常为空）
        self.send_data(stream_id, b'', end_stream=True)

        return stream_id

    def receive_response(self, stream_id):
        return self.streams[stream_id].response
```

### 5.3 Node.js 示例

```javascript
// Node.js HTTP/3 客户端 (使用Undici)

import { fetch } from 'undici';

// Undici 支持 HTTP/3
// 需要 node --experimental-http3 启动

const response = await fetch('https://example.com', {
    connect: {
        protocol: 'HTTP/3'  // 优先 HTTP/3
    }
});

console.log(response.status);
console.log(await response.text());
```

## HTTP/3 服务端配置

### 6.1 Nginx 配置

```nginx
# Nginx HTTP/3 配置 (需要 Nginx 1.25+)

http {
    # HTTP/3 配置
    server {
        listen 443 ssl http2;
        listen 443 ssl http3;  # QUIC/UDP

        server_name example.com;

        # SSL 证书
        ssl_certificate /etc/ssl/example.com.crt;
        ssl_certificate_key /etc/ssl/example.com.key;

        # HTTP/2 和 HTTP/3 兼容
        http2 on;
        http3 on;

        # QUIC 配置
        quic_retry on;                    # 连接迁移重试
        quic_gso on;                      # 通用分段卸载
        quic_mtu 1280;                    # QUIC MTU

        # 添加 HTTP/3 响应头
        add_header alt-svc 'h3=":443"; ma=86400';

        # 位置配置
        location / {
            root /var/www/html;
            index index.html;
        }
    }

    # HTTP/3 防火墙配置
    server {
        listen 443 ssl http3;
        quic_retry on;

        # 允许 QUIC
        add_header alt-svc 'h3=":443"' always;
    }
}
```

### 6.2 Caddy 配置

```nginx
# Caddy 配置（原生支持 HTTP/3）

example.com {
    encode gzip

    # 自动启用 HTTP/3
    handle / {
        root * /var/www/html
        file_server
    }
}
```

### 6.3 Envoy 配置

```yaml
# Envoy HTTP/3 配置

static_resources:
  listeners:
  - address:
      socket_address:
        address: 0.0.0.0
        port_value: 443

    udp_listener_config:
      quic_options: {}

    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          codec_type: auto
          http3_options: &http3_options
            quic_protocol_options:
              header_validation_mode: ua-quic
              envoy_max_concurrent_streams: 100
              initial_stream_window_size: 65535
              initial_connection_window_size: 1048576
          http_protocol_options:
            accept_http_3: true

          # HTTP/3 配置
          http3_protocol_options:
            quic_protocol_options:
              max_concurrent_streams: 100

          route_config:
            virtual_hosts:
            - name: default
              routes:
              - match:
                  prefix: "/"
                route:
                  cluster: web_service

  clusters:
  - name: web_service
    type: STRICT_DNS
    lb_policy: round_robin
    load_assignment:
      cluster_name: web_service
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: localhost
                port_value: 8080
```

## HTTP/3 性能测试

### 7.1 使用 h2load 测试

```bash
# 安装 h2load (nghttp3)

# 测试 HTTP/3
h2load -n 1000 -c 100 -m 10 \
    --h3 \
    https://example.com/

# 测试结果
# finished in     1.23 s
# 1000 requests, 100 concurrent
# Requests/sec:   813.01
# Time per request: 122.90 ms
```

### 7.2 使用 wrk 测试

```bash
# 测试 HTTP/3 性能

wrk -t4 -c100 -d30s \
    --latency \
    https://example.com/

# 输出
# Running 30s test @ https://example.com/
#   4 threads and 100 connections
#   Thread Stats   Avg      Stdev     Max   +/- Stdev
#     Latency     45.23ms    8.12ms  123.45ms   85.23%
#     Req/Sec    512.34     123.45   1024.00    65.43%
```

### 7.3 浏览器测试

```javascript
// 检测浏览器是否支持 HTTP/3

if (navigator.connection) {
    console.log('Network Info API available');

    // 检查协议
    navigator.connection.addEventListener('change', () => {
        const protocol = navigator.connection.effectiveType;
        console.log(`Effective type: ${protocol}`);
    });
}

// 或使用 fetch 检测
fetch('https://http3-check.example.com/', {
    mode: 'cors'
}).then(response => {
    const protocol = response.headers.get('protocol');
    console.log(`Server protocol: ${protocol}`);
});
```

## HTTP/3 兼容性

### 8.1 浏览器支持情况

| 浏览器 | 版本要求 | 状态 |
|--------|----------|------|
| Chrome | 87+ | ✅ 默认启用 |
| Firefox | 88+ | ✅ 默认启用 |
| Safari | 14+ | ✅ 默认启用 |
| Edge | 87+ | ✅ 使用 Chromium |
| 移动端 Chrome | 87+ | ✅ 默认启用 |
| 移动端 Safari | 14+ | ✅ 默认启用 |

### 8.2 服务器支持情况

| 服务器 | HTTP/3 支持 | 版本要求 |
|--------|-------------|----------|
| **Nginx** | ✅ | 1.25+ |
| **Caddy** | ✅ | 2.0+ |
| **Apache** | ✅ | 2.5+ (实验性) |
| **Envoy** | ✅ | 1.19+ |
| **LiteSpeed** | ✅ | 6.0+ |
| **Cloudflare** | ✅ | 已启用 |
| **AWS CloudFront** | ✅ | 已启用 |

### 8.3 回退策略

```python
# HTTP/3 回退到 HTTP/2

class HTTPClient:
    def __init__(self):
        self.preferred_protocol = 'h3'
        self.fallback_protocol = 'h2'

    async def request(self, url):
        try:
            # 尝试 HTTP/3
            response = await self.http3_request(url)
            return response
        except (ProtocolError, TimeoutError) as e:
            # 回退到 HTTP/2
            warnings.warn(f"HTTP/3 failed, falling back: {e}")
            response = await self.http2_request(url)
            return response

    def get_alpn(self, server):
        # 优先选择 HTTP/3
        if self.server_supports_http3(server):
            return 'h3'
        elif self.server_supports_http2(server):
            return 'h2'
        else:
            return 'http/1.1'
```

## HTTP/3 调试工具

### 9.1 Wireshark QUIC 插件

```bash
# Wireshark 配置 QUIC 解密

# 1. 设置环境变量导出 TLS 密钥
# Linux/Mac
export SSLKEYLOGFILE=/path/to/sslkeylog.log

# Windows
setx SSLKEYLOGFILE "C:\path\to\sslkeylog.log"

# 2. Wireshark 配置
# Edit -> Preferences -> Protocols -> TLS
# (Pre)-Master-Secret log filename: /path/to/sslkeylog.log

# 3. 过滤 QUIC 流量
quic || udp.port == 443
```

### 9.2 Chrome 开发工具

```
# Chrome 网络面板查看 HTTP/3

1. 打开 Chrome DevTools (F12)
2. 切换到 Network 标签
3. 右键点击列标题 -> 勾选 "Protocol"
4. 查看 Protocol 列显示 "h3-29" 等表示 HTTP/3

# 查看 QUIC 连接信息
chrome://net-export/  # 导出网络日志
chrome://quic-internals/  # QUIC 内部信息
```

## 小结

HTTP/3 核心要点：

- **基于 QUIC**：使用 UDP 代替 TCP，彻底解决队头阻塞
- **多路复用**：Stream 级别独立，互不影响
- **0-RTT**：后续连接无需等待，节省 RTT
- **连接迁移**：网络切换不掉线
- **TLS 1.3**：内置加密，更安全更快

> 相关阅读：
> - [HTTP 协议：请求方法、状态码、头部字段](/网络/HTTP-协议：请求方法、状态码、头部字段) - HTTP 协议基础
> - [HTTPS 协议原理与 SSL/TLS 加密机制](/网络/HTTPS-协议原理与-SSL-TLS-加密机制) - HTTPS 详解
> - [TCP协议特性（上）：连接管理、滑动窗口](/网络/TCP协议特性（上）：连接管理、滑动窗口) - TCP 连接管理