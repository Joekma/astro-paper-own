---
title: Playwright 高级技巧：网络拦截与模拟
series: playwright
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-network-interception
description: '详细介绍Playwright的高级网络操作，包括请求拦截、响应模拟、网络条件模拟、WebSocket处理等高级技巧。'
tags:
  - Playwright
  - RPA
  - 网络拦截
  - API 模拟
draft: false
language: zh-CN
---

## 概述

网络拦截是 Playwright 最强大的功能之一，它允许你监控、修改、阻止和模拟网络请求和响应。通过网络拦截，你可以实现 API 测试、模拟后端服务、测试错误处理等高级场景。

### 网络拦截能力

```
┌─────────────────────────────────────────────────────────────┐
│                   网络拦截能力                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │    请求拦截      │    │    响应拦截      │                │
│  │                 │    │                 │                │
│  │  • 阻止请求     │    │  • 修改响应     │                │
│  │  • 修改参数     │    │  • 模拟错误     │                │
│  │  • 添加头信息   │    │  • 注入数据     │                │
│  │  • 延迟请求     │    │  • 缓存响应     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │    网络模拟     │    │   API 模拟      │                │
│  │                 │    │                 │                │
│  │  • 慢速网络     │    │  • Mock 数据    │                │
│  │  • 离线模式     │    │  • 模拟后端    │                │
│  │  • 丢包模拟     │    │  • 测试场景    │                │
│  │  • 带宽限制     │    │  • 错误处理    │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 请求拦截

### 基础请求拦截

```python
from playwright.sync_api import sync_playwright, Request, Route

def basic_request_interception():
    """基础请求拦截"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 拦截所有请求
        def handle_request(route: Route, request: Request):
            print(f"拦截请求: {request.method} {request.url}")
            
            # 继续处理请求
            route.continue_()
        
        page.route("**/*", handle_request)
        
        page.goto("https://example.com")
        
        browser.close()
```

### 修改请求

```python
def modify_requests():
    """修改请求"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 添加请求头
        def add_headers(route: Route, request: Request):
            headers = {**request.headers}
            headers["X-Custom-Header"] = "custom-value"
            headers["Authorization"] = "Bearer test-token"
            
            route.continue_(headers=headers)
        
        # 修改 POST 数据
        def modify_post_data(route: Route, request: Request):
            if request.method == "POST":
                # 修改请求体
                import json
                body = json.loads(request.post_data_buffer)
                body["modified"] = True
                route.continue_(post_data=json.dumps(body))
            else:
                route.continue_()
        
        # 应用拦截器
        page.route("**/api/**", add_headers)
        page.route("**/submit", modify_post_data)
        
        page.goto("https://example.com/form")
        
        browser.close()
```

### 阻止请求

```python
def block_requests():
    """阻止请求"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 阻止特定类型的资源
        def block_resource(route: Route, request: Request):
            resource_type = request.resource_type
            
            if resource_type in ["image", "stylesheet", "font"]:
                print(f"阻止资源: {resource_type} - {request.url}")
                route.abort()
            else:
                route.continue_()
        
        # 阻止特定 URL
        def block_ads(route: Route, request: Request):
            if "ads" in request.url or "analytics" in request.url:
                print(f"阻止广告: {request.url}")
                route.abort()
            else:
                route.continue_()
        
        # 阻止 Google Analytics
        page.route("**/google-analytics/**", lambda r, _: r.abort())
        page.route("**/gtag/**", lambda r, _: r.abort())
        page.route("**/*.{png,jpg,jpeg,gif}", lambda r, _: r.abort())
        
        # 测量页面加载时间（无图片）
        import time
        start = time.time()
        page.goto("https://example.com", wait_until="networkidle")
        duration = time.time() - start
        print(f"页面加载时间（无图片）: {duration:.2f}s")
        
        browser.close()
```

## 响应拦截和模拟

### 修改响应

```python
def modify_responses():
    """修改响应"""
    import json
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 修改 JSON 响应
        def mock_api(route: Route, request: Request):
            # 模拟 API 响应
            mock_data = {
                "success": True,
                "data": {
                    "items": [
                        {"id": 1, "name": "Mock Item 1"},
                        {"id": 2, "name": "Mock Item 2"},
                        {"id": 3, "name": "Mock Item 3"}
                    ],
                    "total": 3
                }
            }
            
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps(mock_data)
            )
        
        # 修改 HTML 响应
        def inject_script(route: Route, request: Request):
            response = route.fetch()
            
            # 修改响应内容
            body = response.text()
            body = body.replace(
                "</body>",
                '<script>console.log("注入的脚本");</script></body>'
            )
            
            route.fulfill(
                status=response.status,
                content_type="text/html",
                body=body
            )
        
        # 应用模拟
        page.route("**/api/products", mock_api)
        page.route("**/index.html", inject_script)
        
        page.goto("https://example.com")
        
        browser.close()
```

### 模拟错误

```python
def mock_errors():
    """模拟错误响应"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 模拟网络错误
        def network_error(route: Route, request: Request):
            route.abort("failed")
        
        # 模拟 HTTP 错误
        def http_error(route: Route, request: Request):
            route.fulfill(
                status=500,
                content_type="application/json",
                body='{"error": "Internal Server Error"}'
            )
        
        # 模拟超时
        def timeout_error(route: Route, request: Request):
            import time
            time.sleep(10)  # 模拟慢响应
            route.continue_()
        
        # 测试 404
        page.route("**/api/missing", lambda r, _: r.fulfill(
            status=404,
            content_type="application/json",
            body='{"error": "Not Found"}'
        ))
        
        # 测试网络错误
        page.route("**/api/network-error", network_error)
        
        page.goto("https://example.com")
        
        browser.close()
```

### 条件拦截

```python
def conditional_interception():
    """条件拦截"""
    import json
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 计数器
        request_count = {"api": 0}
        
        def handle_api(route: Route, request: Request):
            request_count["api"] += 1
            
            # 第一次请求返回模拟数据
            if request_count["api"] == 1:
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"data": "first response"})
                )
            else:
                # 后续请求正常转发
                route.continue_()
        
        # 根据参数决定是否拦截
        def selective_mock(route: Route, request: Request):
            if "test=true" in request.url:
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({"mocked": True})
                )
            else:
                route.continue_()
        
        # 正则匹配 URL
        def api_handler(route: Route, request: Request):
            import re
            
            if re.match(r".*/api/v1/users/\d+", request.url):
                # 模拟用户详情
                user_id = re.search(r"/api/v1/users/(\d+)", request.url).group(1)
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps({
                        "id": int(user_id),
                        "name": f"User {user_id}",
                        "email": f"user{user_id}@example.com"
                    })
                )
            else:
                route.continue_()
        
        page.route("**/api/**", handle_api)
        
        page.goto("https://example.com")
        
        browser.close()
```

## API Mock 服务

### Mock 服务类

```python
from dataclasses import dataclass
from typing import Dict, Any, Optional
import json

@dataclass
class MockEndpoint:
    """模拟端点"""
    path: str
    method: str
    status: int
    response: Dict[str, Any]
    delay: float = 0  # 延迟（秒）

class MockServer:
    """Mock 服务器"""
    
    def __init__(self):
        self.endpoints: Dict[str, MockEndpoint] = {}
        self.request_log: list = []
    
    def add_endpoint(self, endpoint: MockEndpoint):
        """添加端点"""
        key = f"{endpoint.method}:{endpoint.path}"
        self.endpoints[key] = endpoint
    
    def get_handler(self):
        """获取请求处理器"""
        def handle(route, request):
            import time
            from playwright.sync_api import Route
            
            # 记录请求
            self.request_log.append({
                "method": request.method,
                "url": request.url,
                "headers": dict(request.headers),
                "post_data": request.post_data_buffer.decode() if request.post_data_buffer else None
            })
            
            # 查找匹配的端点
            key = f"{request.method}:{request.path}"
            endpoint = self.endpoints.get(key)
            
            if endpoint:
                # 延迟响应
                if endpoint.delay > 0:
                    time.sleep(endpoint.delay)
                
                route.fulfill(
                    status=endpoint.status,
                    content_type="application/json",
                    body=json.dumps(endpoint.response)
                )
            else:
                # 未找到端点
                route.fulfill(
                    status=404,
                    content_type="application/json",
                    body=json.dumps({"error": "Not Found"})
                )
        
        return handle
    
    def setup_routes(self, page):
        """设置页面路由"""
        page.route("**/api/**", self.get_handler())

# 使用示例
def use_mock_server():
    """使用 Mock 服务器"""
    mock = MockServer()
    
    # 添加端点
    mock.add_endpoint(MockEndpoint(
        path="/api/users",
        method="GET",
        status=200,
        response={
            "users": [
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"}
            ]
        }
    ))
    
    mock.add_endpoint(MockEndpoint(
        path="/api/users",
        method="POST",
        status=201,
        response={"id": 3, "name": "Charlie"}
    ))
    
    mock.add_endpoint(MockEndpoint(
        path="/api/users/1",
        method="GET",
        status=200,
        response={"id": 1, "name": "Alice"},
        delay=0.5  # 模拟延迟
    ))
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 设置 Mock 路由
        mock.setup_routes(page)
        
        # 访问页面
        page.goto("https://example.com")
        
        # 触发 API 调用
        page.evaluate("""
            async () => {
                const response = await fetch('/api/users');
                const data = await response.json();
                console.log('Users:', data);
            }
        """)
        
        # 查看请求日志
        print("请求日志:")
        for log in mock.request_log:
            print(f"  {log['method']} {log['url']}")
        
        browser.close()
```

## 网络条件模拟

### 慢速网络

```python
def simulate_slow_network():
    """模拟慢速网络"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 设置网络节流
        context.set_offline(offline=False)
        
        # 模拟慢速连接
        client = context.new_cdp_session(context.pages[0] if context.pages else None)
        
        # 设置 CPU 节流（5x 慢）
        client.send("Emulation.setCPUThrottlingRate", {"rate": 5})
        
        page = context.new_page()
        
        # 拦截请求添加延迟
        def slow_down(route, request):
            import time
            time.sleep(0.5)  # 每个请求延迟 500ms
            route.continue_()
        
        page.route("**/*", slow_down)
        
        page.goto("https://example.com")
        
        # 测量加载时间
        import time
        start = time.time()
        page.goto("https://example.com", wait_until="networkidle")
        print(f"慢速网络加载时间: {time.time() - start:.2f}s")
        
        browser.close()
```

### 离线模式

```python
def offline_mode():
    """离线模式测试"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 启用离线模式
        context.set_offline(True)
        
        page = context.new_page()
        
        try:
            page.goto("https://example.com")
            print("警告：页面应该在离线模式下加载失败！")
        except Exception as e:
            print(f"预期行为：离线模式下无法加载 - {e}")
        
        # 模拟离线但有缓存的场景
        context.set_offline(False)
        
        # 拦截并返回缓存响应
        def serve_cached(route, request):
            route.fulfill(
                status=200,
                content_type="text/html",
                body="<html><body><h1>Cached Page</h1></body></html>"
            )
        
        page.route("**/*", serve_cached)
        
        context.set_offline(True)  # 离线但有"缓存"
        page.goto("https://example.com")
        
        browser.close()
```

### 模拟不同的网络条件

```python
def network_conditions():
    """模拟不同网络条件"""
    from enum import Enum
    
    class NetworkProfile(Enum):
        """网络配置"""
        WIFI = {"download": 50 * 1024 * 1024, "upload": 10 * 1024 * 1024}
        MOBILE_3G = {"download": 750 * 1024, "upload": 250 * 1024, "latency": 100}
        MOBILE_4G = {"download": 4 * 1024 * 1024, "upload": 3 * 1024 * 1024, "latency": 20}
        SLOW_2G = {"download": 50 * 1024, "upload": 30 * 1024, "latency": 500}
    
    def apply_network_profile(context, profile: NetworkProfile):
        """应用网络配置"""
        settings = profile.value
        
        # 设置下载/上传限制
        # 注意：Playwright 没有直接的带宽限制 API
        # 我们通过拦截器模拟延迟
        
        latency = settings.get("latency", 0)
        
        def add_latency(route, request):
            import time
            if latency > 0:
                time.sleep(latency / 1000)  # 转换为秒
            route.continue_()
        
        page = context.new_page()
        page.route("**/*", add_latency)
        
        return page
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 测试不同网络条件
        for profile_name in ["SLOW_2G", "MOBILE_3G", "MOBILE_4G"]:
            print(f"\n测试 {profile_name}:")
            page = apply_network_profile(context, NetworkProfile[profile_name])
            
            import time
            start = time.time()
            page.goto("https://example.com", wait_until="domcontentloaded")
            print(f"  加载时间: {time.time() - start:.2f}s")
            
            page.close()
        
        browser.close()
```

## WebSocket 处理

### WebSocket 拦截

```python
def websocket_interception():
    """WebSocket 拦截"""
    import json
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 监听 WebSocket 事件
        def on_websocket(ws):
            print(f"WebSocket 连接: {ws.url}")
            
            # 监听消息
            ws.on("framesent", lambda payload: print(f"发送: {payload}"))
            ws.on("framereceived", lambda payload: print(f"接收: {payload}"))
            
            # 模拟服务器消息
            ws.send(json.dumps({"type": "ping", "data": "pong"}))
        
        page.on("websocket", on_websocket)
        
        # 创建 WebSocket 连接
        page.evaluate("""
            () => {
                const ws = new WebSocket('wss://echo.websocket.org');
                ws.onopen = () => {
                    console.log('WebSocket 已连接');
                    ws.send('Hello Server');
                };
                ws.onmessage = (event) => {
                    console.log('收到消息:', event.data);
                };
                ws.onerror = (error) => {
                    console.error('WebSocket 错误:', error);
                };
            }
        """)
        
        import time
        time.sleep(2)
        
        browser.close()
```

### Mock WebSocket 服务器

```python
def mock_websocket():
    """模拟 WebSocket"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        
        # 监听 WebSocket 并拦截
        def handle_websocket(ws):
            print(f"拦截 WebSocket: {ws.url}")
            
            # 拦截并修改 WebSocket 握手
            ws.on("connect", lambda: print("WebSocket 已连接"))
            
            # 模拟服务器响应
            ws.send(json.dumps({
                "type": "notification",
                "message": "这是模拟的消息",
                "timestamp": "2024-01-01T00:00:00Z"
            }))
        
        page.on("websocket", handle_websocket)
        
        # 尝试连接
        page.evaluate("""
            () => {
                const ws = new WebSocket('wss://example.com/ws');
                ws.onopen = () => ws.send('connect');
                ws.onmessage = (e) => console.log('Server:', e.data);
            }
        """)
        
        import time
        time.sleep(2)
        
        browser.close()
```

## 高级应用

### 测试错误处理

```python
def test_error_handling():
    """测试 API 错误处理"""
    import json
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 模拟各种错误场景
        error_scenarios = [
            ("500", 500, "Internal Server Error"),
            ("401", 401, "Unauthorized"),
            ("403", 403, "Forbidden"),
            ("404", 404, "Not Found"),
            ("timeout", "timeout", "Request Timeout"),
            ("network", "failed", "Network Error")
        ]
        
        for name, status, message in error_scenarios:
            # 设置当前错误场景
            def error_handler(route, request):
                if status == "timeout":
                    route.abort("timedout")
                elif status == "network":
                    route.abort("failed")
                else:
                    route.fulfill(
                        status=status,
                        content_type="application/json",
                        body=json.dumps({"error": message})
                    )
            
            page.route("**/api/test-error", error_handler)
            
            # 执行测试
            result = page.evaluate("""
                async () => {
                    try {
                        const response = await fetch('/api/test-error');
                        if (!response.ok) {
                            const error = await response.json();
                            return { success: false, error: error.error };
                        }
                        return { success: true };
                    } catch (e) {
                        return { success: false, error: e.message };
                    }
                }
            """)
            
            print(f"场景 {name}: {result}")
        
        browser.close()
```

### 缓存测试

```python
def cache_testing():
    """缓存测试"""
    import json
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        request_count = {"api": 0}
        
        def handle_api(route, request):
            request_count["api"] += 1
            
            # 检查是否有 If-None-Match 头（缓存验证）
            headers = dict(request.headers)
            
            if request_count["api"] > 1 and "if-none-match" in headers:
                # 返回 304 Not Modified
                route.fulfill(
                    status=304,
                    headers={"ETag": '"abc123"'}
                )
            else:
                # 返回完整响应
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    headers={"ETag": '"abc123"', "Cache-Control": "max-age=3600"},
                    body=json.dumps({"data": f"Response {request_count['api']}"})
                )
        
        page.route("**/api/cached", handle_api)
        
        page.goto("https://example.com")
        
        # 第一次请求
        result1 = page.evaluate("fetch('/api/cached').then(r => r.json())")
        print(f"第一次: {result1}")
        
        # 第二次请求（应该使用缓存）
        result2 = page.evaluate("fetch('/api/cached').then(r => r.json())")
        print(f"第二次: {result2}")
        
        print(f"总请求数: {request_count['api']}")
        
        browser.close()
```

### 模拟认证流程

```python
def mock_authentication():
    """模拟认证流程"""
    import json
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 创建两个上下文模拟不同用户
        context1 = browser.new_context()
        context2 = browser.new_context()
        
        def handle_auth(route, request):
            headers = dict(request.headers)
            
            if "/api/auth/login" in request.url and request.method == "POST":
                # 模拟登录
                body = json.loads(request.post_data_buffer)
                if body.get("username") == "admin":
                    route.fulfill(
                        status=200,
                        content_type="application/json",
                        headers={"Authorization": "Bearer admin-token-123"},
                        body=json.dumps({
                            "token": "admin-token-123",
                            "user": {"id": 1, "name": "Admin", "role": "admin"}
                        })
                    )
                else:
                    route.fulfill(
                        status=401,
                        content_type="application/json",
                        body=json.dumps({"error": "Invalid credentials"})
                    )
            elif "/api/protected" in request.url:
                # 验证令牌
                auth_header = headers.get("authorization", "")
                if auth_header == "Bearer admin-token-123":
                    route.fulfill(
                        status=200,
                        content_type="application/json",
                        body=json.dumps({"data": "Protected data"})
                    )
                else:
                    route.fulfill(
                        status=401,
                        content_type="application/json",
                        body=json.dumps({"error": "Unauthorized"})
                    )
            else:
                route.continue_()
        
        # 测试用户1（管理员）
        page1 = context1.new_page()
        page1.route("**/api/**", handle_auth)
        page1.goto("https://example.com")
        
        # 执行登录
        login_result = page1.evaluate("""
            async () => {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({username: 'admin', password: 'pass'})
                });
                return response.json();
            }
        """)
        print(f"用户1 登录: {login_result}")
        
        # 测试用户2（未授权）
        page2 = context2.new_page()
        page2.route("**/api/**", handle_auth)
        page2.goto("https://example.com")
        
        # 尝试访问受保护资源
        access_result = page2.evaluate("""
            async () => {
                const response = await fetch('/api/protected');
                return { status: response.status };
            }
        """)
        print(f"用户2 访问: {access_result}")
        
        browser.close()
```
