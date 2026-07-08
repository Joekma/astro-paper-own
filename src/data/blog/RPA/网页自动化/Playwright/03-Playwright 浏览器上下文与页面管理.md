---
title: Playwright 浏览器上下文与页面管理
series: playwright
seriesOrder: 3
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-context-page-management
description: '深入介绍Playwright的浏览器上下文管理、多页面操作、窗口管理、以及如何实现浏览器状态的持久化和隔离。'
tags:
  - Playwright
  - RPA
  - 浏览器上下文
  - 页面管理
draft: false
language: zh-CN
---

## 概述

在 Playwright 中，浏览器上下文（BrowserContext）和页面（Page）是两个核心概念。理解它们的关系和管理方法对于构建稳定、高效的自动化脚本至关重要。

### 核心概念图

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Browser Instance                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  Context 1       │    │  Context 2       │                  │
│  │  (用户 A 会话)    │    │  (用户 B 会话)    │                  │
│  │                  │    │                  │                  │
│  │  ┌──────────┐   │    │  ┌──────────┐   │                  │
│  │  │ Page 1.1  │   │    │  │ Page 2.1 │   │                  │
│  │  │ 标签页 1  │   │    │  │ 标签页 1 │   │                  │
│  │  └──────────┘   │    │  └──────────┘   │                  │
│  │  ┌──────────┐   │    │  ┌──────────┐   │                  │
│  │  │ Page 1.2  │   │    │  │ Page 2.2 │   │                  │
│  │  │ 标签页 2  │   │    │  │ 标签页 2 │   │                  │
│  │  └──────────┘   │    │  └──────────┘   │                  │
│  │                  │    │                  │                  │
│  │  独立 Cookie     │    │  独立 Cookie     │                  │
│  │  独立 Storage    │    │  独立 Storage    │                  │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 浏览器上下文详解

### 什么是浏览器上下文

浏览器上下文是一个独立的浏览器执行环境，类似于浏览器中的"隐私窗口"或"访客模式"。每个上下文都有自己独立的：

- Cookie 和 Session Storage
- Local Storage
- 缓存
- 代理设置
- 权限配置
- 地理位置

### 创建浏览器上下文

```python
from playwright.sync_api import sync_playwright

def context_creation_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 基础创建
        context = browser.new_context()
        
        # 带配置创建
        context = browser.new_context(
            # 视口大小
            viewport={"width": 1920, "height": 1080},
            # 用户代理
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            # 语言
            locale="zh-CN",
            # 时区
            timezone_id="Asia/Shanghai",
            # 设备比例
            device_scale_factor=2,
            # 是否自动下载
            accept_downloads=True,
            # 权限列表
            permissions=["geolocation", "notifications"],
            # 颜色方案
            color_scheme="dark"  # "light" | "dark" | "no-preference"
        )
        
        # 使用预定义设备
        context = browser.new_context(**p.devices["iPhone 13"])
        
        # 使用预定义设备但自定义配置
        context = browser.new_context(
            **p.devices["iPhone 13"],
            viewport={"width": 390, "height": 844},  # iPhone 14 Pro
            permissions=["geolocation"]
        )
        
        browser.close()
```

### 上下文配置选项

#### 地理位置配置

```python
def geolocation_example():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 设置地理位置
        context = browser.new_context(
            geolocation={"latitude": 39.9042, "longitude": 116.4074},
            permissions=["geolocation"]
        )
        
        page = context.new_page()
        page.goto("https://www.google.com/maps")
        
        # 验证位置
        page.wait_for_selector("text=北京")
        
        browser.close()
```

#### 权限管理

```python
def permissions_example():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 授予特定权限
        context = browser.new_context(
            permissions=["geolocation", "notifications", "camera", "microphone"]
        )
        
        page = context.new_page()
        page.goto("https://permission.site")
        
        # 撤销权限
        context.grant_permissions([], source_origin="https://permission.site")
        
        # 清除所有权限
        context.clear_permissions()
        
        browser.close()
```

### 上下文状态持久化

#### 保存和加载状态

```python
def save_load_state():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 第一次：创建上下文并登录
        context = browser.new_context()
        page = context.new_page()
        
        page.goto("https://example.com/login")
        page.fill("#username", "testuser")
        page.fill("#password", "password123")
        page.click("button[type='submit']")
        page.wait_for_url("**/dashboard")
        
        # 保存状态到文件
        storage = context.storage_state()
        with open("auth_state.json", "w") as f:
            f.write(storage)
        
        browser.close()
        
        # ========================================
        
        # 第二次：加载已保存的状态
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 加载保存的状态
        context.storage_state(path="auth_state.json")
        
        page = context.new_page()
        page.goto("https://example.com/dashboard")
        
        # 已登录状态，无需再次登录
        print(page.title())
        
        browser.close()
```

#### 保存特定域名的状态

```python
def save_specific_origin():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        page = context.new_page()
        
        # 登录多个网站
        page.goto("https://site1.com/login")
        # ... 登录 site1
        
        page.goto("https://site2.com/login")
        # ... 登录 site2
        
        # 只保存 site1 的状态
        storage = context.storage_state(
            path="site1_auth.json",
            origin="https://site1.com"
        )
        
        browser.close()
```

### 上下文隔离实战

```python
def isolated_contexts():
    """模拟多个用户同时操作"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 创建两个隔离的上下文（两个用户）
        user1_context = browser.new_context()
        user2_context = browser.new_context()
        
        # 用户1：登录
        user1_page = user1_context.new_page()
        user1_page.goto("https://example.com/login")
        user1_page.fill("#username", "user1")
        user1_page.fill("#password", "password1")
        user1_page.click("button[type='submit']")
        
        # 用户2：登录
        user2_page = user2_context.new_page()
        user2_page.goto("https://example.com/login")
        user2_page.fill("#username", "user2")
        user2_page.fill("#password", "password2")
        user2_page.click("button[type='submit']")
        
        # 验证：两个用户在不同会话中
        print(f"User1: {user1_page.url}")
        print(f"User2: {user2_page.url}")
        
        # 两个页面的 cookie 是完全隔离的
        assert user1_context.cookies() != user2_context.cookies()
        
        # 清理
        user1_context.close()
        user2_context.close()
        browser.close()
```

## 页面管理详解

### 创建新页面

```python
def page_creation_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 从上下文创建新页面
        page = context.new_page()
        
        # 使用 about:blank
        page = context.new_page()
        page.goto("about:blank")
        
        # 创建多个页面
        pages = []
        for i in range(3):
            pages.append(context.new_page())
        
        browser.close()
```

### 页面导航

#### 基本导航

```python
def navigation_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 基本导航
        page.goto("https://example.com")
        
        # 等待页面加载完成
        page.goto("https://example.com", wait_until="load")
        
        # 等待网络空闲
        page.goto("https://example.com", wait_until="networkidle")
        
        # 带超时
        page.goto("https://example.com", timeout=30000)
        
        # 等待特定元素
        page.goto("https://example.com")
        page.wait_for_selector("#content")
        
        # 后退
        page.go_back()
        
        # 前进
        page.go_forward()
        
        # 刷新
        page.reload()
        
        browser.close()
```

#### 导航等待选项

| 等待条件 | 说明 |
|---------|------|
| `"load"` | 默认，等待 load 事件 |
| `"domcontentloaded"` | 等待 DOMContentLoaded 事件 |
| `"networkidle"` | 等待网络空闲 500ms |
| `"commit"` | 等待资源响应 |

```python
def navigation_with_conditions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 等待 DOM 加载（更快）
        page.goto("https://example.com", wait_until="domcontentloaded")
        
        # 等待网络完全空闲（更慢但更稳定）
        page.goto("https://example.com", wait_until="networkidle")
        
        # 带超时和重试
        try:
            page.goto("https://example.com", timeout=10000)
        except TimeoutError:
            print("页面加载超时")
        
        browser.close()
```

### 多标签页管理

#### 创建新标签页

```python
def multi_tab_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page1 = browser.new_page()
        
        # 在新标签页打开链接
        page1.goto("https://example.com")
        page1.click("a[target='_blank']")
        
        # 等待新标签页出现
        page2 = browser.contexts[0].pages[-1]
        
        # 或者手动创建新标签
        page2 = browser.contexts[0].new_page()
        page2.goto("https://example.org")
        
        # 获取所有页面
        all_pages = browser.contexts[0].pages
        print(f"共有 {len(all_pages)} 个标签页")
        
        # 切换页面
        page1.bring_to_front()  # 将页面置顶
        
        browser.close()
```

#### 等待新标签页

```python
def wait_for_new_tab():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 方法1：使用 Promise
        with page.context.expect_page() as new_page_info:
            page.click("a[target='_blank']")
        
        new_page = new_page_info.value
        
        # 在新页面执行操作
        new_page.wait_for_load_state()
        print(f"新页面标题: {new_page.title()}")
        
        # 关闭新页面
        new_page.close()
        
        browser.close()
```

#### 关闭标签页

```python
def close_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 创建多个页面
        pages = [context.new_page() for _ in range(3)]
        
        # 关闭特定页面
        pages[1].close()
        
        # 关闭所有页面
        for page in context.pages:
            page.close()
        
        browser.close()
```

### iframe 处理

```python
def iframe_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/iframe-page")
        
        # 获取 iframe
        frame = page.frame(name="iframe-name")
        
        # 通过 URL 获取
        frame = page.frame(url="https://example.com/iframe")
        
        # 获取所有 iframe
        frames = page.frames
        print(f"页面共有 {len(frames)} 个 frame")
        
        # 在 iframe 中操作
        if frame:
            frame.fill("input[name='username']", "testuser")
            frame.click("button[type='submit']")
        
        # 获取嵌套 iframe
        main_frame = page.frame(name="main")
        if main_frame:
            nested_frame = main_frame.frame(name="nested")
            if nested_frame:
                nested_frame.fill("input", "value")
        
        browser.close()
```

### 弹窗处理

```python
def popup_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 监听对话框（alert, confirm, prompt）
        page.on("dialog", lambda dialog: dialog.accept())
        
        # 监听新窗口/新标签页
        with page.context.expect_page() as popup_info:
            page.click("button.open-popup")
        
        popup = popup_info.value
        popup.wait_for_load_state()
        print(f"弹窗标题: {popup.title()}")
        
        # 关闭弹窗
        popup.close()
        
        # 监听下载
        page.on("download", lambda download: download.save_as("file.pdf"))
        
        browser.close()
```

### 页面事件监听

```python
def page_event_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 监听页面加载完成
        page.on("load", lambda: print("页面加载完成"))
        
        # 监听导航完成
        page.on("framenavigated", lambda frame: print(f"导航到: {frame.url}"))
        
        # 监听请求
        def log_request(request):
            print(f"请求: {request.url}")
        
        page.on("request", log_request)
        
        # 监听响应
        def log_response(response):
            if response.status >= 400:
                print(f"错误响应: {response.status} - {response.url}")
        
        page.on("response", log_response)
        
        # 监听控制台消息
        def log_console(msg):
            print(f"控制台 [{msg.type}]: {msg.text}")
        
        page.on("console", log_console)
        
        # 监听页面错误
        def log_error(error):
            print(f"页面错误: {error}")
        
        page.on("pageerror", log_error)
        
        # 执行操作
        page.goto("https://example.com")
        
        # 移除监听器
        page.remove_listener("request", log_request)
        
        browser.close()
```

### 页面元数据获取

```python
def page_metadata():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 获取标题
        title = page.title()
        
        # 获取 URL
        url = page.url
        
        # 获取视口大小
        viewport = page.viewport_size
        
        # 获取内容
        html = page.content()  # 完整 HTML
        inner_html = page.inner_html("body")  # body 的内容
        
        # 获取文本
        text = page.inner_text("body")
        
        # 获取属性
        link = page.get_attribute("a.link", "href")
        
        # 获取多个属性
        attributes = page.evaluate("""() => {
            const el = document.querySelector('meta[name="description"]');
            return el ? el.attributes : null;
        }""")
        
        print(f"标题: {title}")
        print(f"URL: {url}")
        
        browser.close()
```

## 高级应用

### 窗口管理

```python
def window_management():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 设置视口大小
        page.set_viewport_size({"width": 1920, "height": 1080})
        
        # 获取窗口大小
        window_size = page.evaluate("""() => ({
            width: window.innerWidth,
            height: window.innerHeight
        })""")
        
        # 全屏
        page.evaluate("document.body.requestFullscreen()")
        
        # 最小化窗口
        page.minimize()
        
        # 最大化窗口
        page.maximize()
        
        # 移动窗口
        page.set_position({"x": 0, "y": 0})
        
        # 获取窗口位置
        position = page.position()
        
        browser.close()
```

### 设备模拟

```python
def device_emulation():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 使用预定义设备
        devices = [
            "iPhone 13",
            "iPhone 13 Pro",
            "iPad Pro 11",
            "Pixel 5",
            "Samsung Galaxy S20"
        ]
        
        for device_name in devices:
            context = browser.new_context(**p.devices[device_name])
            page = context.new_page()
            
            page.goto("https://example.com")
            print(f"{device_name}: {page.viewport_size}")
            
            context.close()
        
        browser.close()
```

### 视图模式切换

```python
def view_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 有头模式（显示窗口）
        page = browser.new_page()
        
        # 切换到无头模式（需要重启页面）
        page.close()
        
        # 无头模式（不显示窗口，速度更快）
        context = browser.new_context()
        page = context.new_page()
        
        # 截图验证
        page.goto("https://example.com")
        page.screenshot(path="example.png")
        
        browser.close()
```

## 最佳实践

### 资源管理

```python
# 推荐：使用上下文管理器自动清理
def recommended_pattern():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        
        page.goto("https://example.com")
        # ... 执行操作
        
        # 自动清理，不需要手动 close
```

```python
# 注意：显式关闭所有资源
def explicit_cleanup():
    try:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        
        page.goto("https://example.com")
        # ... 执行操作
        
    finally:
        # 确保资源被释放
        page.close()
        context.close()
        browser.close()
```

### 错误处理

```python
def error_handling():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # 尝试导航到页面
            response = page.goto("https://example.com")
            
            # 检查响应状态
            if response.status != 200:
                print(f"页面状态码: {response.status}")
            
            # 等待内容加载
            page.wait_for_selector("#content", timeout=5000)
            
        except TimeoutError:
            print("操作超时")
            
        except Exception as e:
            print(f"发生错误: {e}")
            
        finally:
            # 清理资源
            page.close()
            context.close()
            browser.close()
```

### 并行执行

```python
from concurrent.futures import ThreadPoolExecutor

def parallel_execution():
    def run_test(url):
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(url)
            title = page.title()
            browser.close()
            return title
    
    urls = [
        "https://example.com",
        "https://example.org",
        "https://example.net"
    ]
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(run_test, urls))
    
    print(results)
```

