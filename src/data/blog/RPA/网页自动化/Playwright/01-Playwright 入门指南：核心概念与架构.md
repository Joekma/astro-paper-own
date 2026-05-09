---
title: Playwright 入门指南：核心概念与架构
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-getting-started
description: 'Playwright入门指南，详细介绍核心概念、架构组件、支持的浏览器和开发环境配置。'
tags:
  - Playwright
  - RPA
  - 自动化测试
  - 网页自动化
draft: false
language: zh-CN
---

## 概述

Playwright 是由 Microsoft 开发的一款强大的端到端测试和网页自动化框架。它支持所有现代浏览器的自动化操作，包括 Chromium（Chrome/Edge）、Firefox 和 WebKit（Safari）。与其他自动化工具相比，Playwright 提供了更现代的 API、更好的稳定性和更丰富的功能集。

### 为什么选择 Playwright？

| 特性 | 说明 |
|------|------|
| **跨浏览器支持** | 一次编写，多浏览器运行 |
| **自动等待机制** | 智能等待元素就绪，减少不稳定的测试 |
| **并行执行** | 支持跨浏览器、跨标签页的并行测试 |
| **强大的定位能力** | 支持多种选择器策略 |
| **网络拦截** | 可以模拟和拦截网络请求 |
| **移动端模拟** | 支持 iOS 和 Android 模拟器 |
| **无头模式** | 支持无头和有头模式运行 |

## 核心概念

### Playwright 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         Playwright                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Layer                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │    │
│  │  │ Browser  │  │ Context  │  │  Page    │  │ Element │ │    │
│  │  │  Runner  │  │  Manager │  │  Actions │  │ Handler │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Browser Driver Layer                        │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │    │
│  │  │ Chromium   │  │  Firefox   │  │  WebKit    │        │    │
│  │  │  (Chrome)  │  │            │  │  (Safari)  │        │    │
│  │  └────────────┘  └────────────┘  └────────────┘        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 核心对象层级

Playwright 的核心对象按照层级组织：

```
Browser（浏览器实例）
├── Context（浏览器上下文）
│   ├── Page（页面）
│   │   ├── Frame（框架）
│   │   └── Locator（定位器）
│   ├── APIRequest（API 请求）
│   └── StorageState（存储状态）
└── BrowserType（浏览器类型）
```

### Browser（浏览器）

Browser 是 Playwright 的顶级对象，代表一个独立的浏览器实例。可以同时运行多个浏览器实例，每个实例相互隔离。

**主要方法：**
- `launch()` - 启动浏览器
- `newContext()` - 创建新的浏览器上下文
- `close()` - 关闭浏览器

### Context（浏览器上下文）

BrowserContext 是一个隔离的执行环境，类似于浏览器中的"隐私模式"。每个上下文都有独立的 Cookie、Storage、代理设置等。

**使用场景：**
- 模拟不同的用户会话
- 并行运行多个测试
- 隔离有副作用的操作

### Page（页面）

Page 代表一个标签页或弹窗，是与网页交互的主要入口。可以执行 JavaScript、操作 DOM、监听事件等。

**核心功能：**
- 页面导航：`goto()`, `back()`, `forward()`, `reload()`
- 元素操作：`click()`, `fill()`, `select()`
- 内容获取：`innerText()`, `innerHTML()`, `title()`
- 等待操作：`waitForSelector()`, `waitForNavigation()`

## 支持的浏览器

### 浏览器对比

| 浏览器 | 渲染引擎 | 特点 | 使用场景 |
|--------|----------|------|----------|
| **Chromium** | Blink | 最稳定，支持所有特性 | 首选，推荐用于生产环境 |
| **Firefox** | Gecko | 良好的标准兼容性 | 跨浏览器测试 |
| **WebKit** | WebKit | Safari 模拟 | macOS/iOS 测试 |

### 选择浏览器的建议

1. **日常开发和调试** - 使用 Chromium，无头模式运行
2. **跨浏览器测试** - 使用所有三种浏览器
3. **CI/CD 集成** - 使用 Chromium，无头模式
4. **移动端测试** - 使用 Chromium + 设备模拟

## 开发环境配置

### Python 环境要求

```bash
# Python 3.7 或更高版本
python --version
```

### 安装 Playwright

```bash
# 使用 pip 安装
pip install playwright

# 安装浏览器驱动
playwright install

# 或者安装指定浏览器
playwright install chromium
playwright install firefox
playwright install webkit
```

### 验证安装

```python
from playwright.sync_api import sync_playwright

def test_playwright_install():
    with sync_playwright() as p:
        # 启动 Chromium 浏览器
        browser = p.chromium.launch()
        
        # 创建新页面
        page = browser.new_page()
        
        # 访问示例网站
        page.goto("https://example.com")
        
        # 获取页面标题
        title = page.title()
        print(f"页面标题: {title}")
        
        # 关闭浏览器
        browser.close()
        
        print("Playwright 安装成功！🎉")

if __name__ == "__main__":
    test_playwright_install()
```

### 第一个脚本

创建一个简单的自动化脚本：

```python
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 显示浏览器窗口
        
        # 创建新上下文
        context = browser.new_context()
        
        # 创建新页面
        page = context.new_page()
        
        # 访问 GitHub
        page.goto("https://github.com")
        
        # 获取页面标题
        print(f"当前页面标题: {page.title()}")
        
        # 截图保存
        page.screenshot(path="github_homepage.png")
        
        # 关闭浏览器
        browser.close()
        print("脚本执行完成！")

if __name__ == "__main__":
    main()
```

## 同步与异步 API

Playwright 同时提供同步和异步两种 API：

### 同步 API（推荐入门）

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto("https://example.com")
    browser.close()
```

### 异步 API（适合高并发）

```python
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://example.com")
        await browser.close()

asyncio.run(main())
```

### 选择建议

- **同步 API** - 简单脚本、测试入门、顺序执行的任务
- **异步 API** - 大规模爬虫、需要并发操作、性能敏感的应用

## 常见使用场景

### 1. 网页自动化测试

```python
def test_login_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 访问登录页面
        page.goto("https://example.com/login")
        
        # 填写表单
        page.fill("#username", "testuser")
        page.fill("#password", "password123")
        
        # 点击登录按钮
        page.click("button[type='submit']")
        
        # 验证登录成功
        assert page.url.endswith("/dashboard")
        
        browser.close()
```

### 2. 网页爬虫

```python
def scrape_dynamic_content():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 等待内容加载
        page.goto("https://example.com/products")
        page.wait_for_selector(".product-item")
        
        # 提取数据
        products = page.query_selector_all(".product-item")
        for product in products:
            name = product.query_selector(".product-name").inner_text()
            price = product.query_selector(".product-price").inner_text()
            print(f"{name}: {price}")
        
        browser.close()
```

### 3. 截图和 PDF 生成

```python
def capture_page():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 生成截图
        page.goto("https://example.com")
        page.screenshot(path="fullpage.png", full_page=True)
        
        # 生成 PDF
        page.pdf(path="page.pdf")
        
        browser.close()
```

## 最佳实践

### 1. 使用上下文隔离

```python
# 好的做法：每个测试使用独立上下文
def test_isolated():
    with sync_playwright() as p:
        context = p.chromium.new_context()
        page = context.new_page()
        # 执行测试...
        context.close()

# 避免：在测试间共享上下文
```

### 2. 合理使用等待

```python
# 推荐：使用自动等待
page.click("button#submit")

# 谨慎：使用显式等待
page.wait_for_selector("div.loaded", state="visible", timeout=5000)
```

### 3. 清理资源

```python
# 使用上下文管理器自动清理
with sync_playwright() as p:
    browser = p.chromium.launch()
    # ... 执行操作
# 自动关闭浏览器
```

