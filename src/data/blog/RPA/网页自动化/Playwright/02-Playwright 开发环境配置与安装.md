---
title: Playwright 开发环境配置与安装
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-installation
description: '详细介绍Playwright的各种安装方式，包括Python、Node.js环境配置，以及浏览器驱动的安装和管理。'
tags:
  - Playwright
  - RPA
  - 安装配置
  - 开发环境
draft: false
language: zh-CN
---

## 概述

在开始使用 Playwright 之前，我们需要正确配置开发环境。Playwright 支持多种编程语言，包括 Python、JavaScript/TypeScript、Java 和 .NET。本教程以 Python 为主要示例，同时提供其他语言的简要说明。

### 系统要求

| 要求 | 说明 |
|------|------|
| **操作系统** | Windows 10+, macOS 10.14+, Linux |
| **Python** | 3.7 或更高版本 |
| **内存** | 至少 4GB RAM（推荐 8GB） |
| **磁盘空间** | 至少 2GB（用于浏览器驱动） |
| **网络** | 稳定的网络连接（用于下载浏览器） |

## Python 环境配置

### 方式一：使用虚拟环境（推荐）

虚拟环境可以隔离项目依赖，避免版本冲突：

```bash
# 创建虚拟环境
python -m venv playwright-env

# 激活虚拟环境
# Windows
playwright-env\Scripts\activate

# macOS/Linux
source playwright-env/bin/activate

# 安装 Playwright
pip install playwright

# 安装浏览器驱动
playwright install
```

### 方式二：使用 Conda 环境

```bash
# 创建 conda 环境
conda create -n playwright-env python=3.11

# 激活环境
conda activate playwright-env

# 安装 Playwright
pip install playwright

# 安装浏览器驱动
playwright install
```

### 方式三：全局安装

```bash
# 直接全局安装
pip install playwright

# 安装浏览器驱动
playwright install
```

## 浏览器驱动安装

### 安装所有浏览器

```bash
playwright install
```

这将安装 Chromium、Firefox 和 WebKit 三种浏览器。

### 安装特定浏览器

```bash
# 仅安装 Chromium
playwright install chromium

# 仅安装 Firefox
playwright install firefox

# 仅安装 WebKit
playwright install webkit
```

### 安装特定版本

```bash
# 安装特定版本的 Chromium
playwright install chromium --version=999.0.0.0

# 查看可用版本
playwright install --help
```

### 安装系统依赖（Linux）

在 Linux 系统上，可能需要安装系统依赖：

```bash
# Debian/Ubuntu
playwright install-deps

# 或者手动安装
sudo apt-get install -y \
    libgtk-3-0 \
    libwebkit2gtk-4.0-37 \
    libnss3 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libgbm1 \
    libasound2
```

### 验证安装

创建验证脚本：

```python
from playwright.sync_api import sync_playwright

def verify_installation():
    print("🔍 开始验证 Playwright 安装...\n")
    
    with sync_playwright() as p:
        # 检查 Chromium
        print("✅ Chromium:")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("data:text/html,<h1>Hello from Chromium</h1>")
        print(f"   - 版本: {p.chromium.name}")
        print(f"   - 状态: 正常")
        browser.close()
        
        # 检查 Firefox
        print("\n✅ Firefox:")
        browser = p.firefox.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("data:text/html,<h1>Hello from Firefox</h1>")
        print(f"   - 版本: {p.firefox.name}")
        print(f"   - 状态: 正常")
        browser.close()
        
        # 检查 WebKit
        print("\n✅ WebKit:")
        browser = p.webkit.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.goto("data:text/html,<h1>Hello from WebKit</h1>")
        print(f"   - 版本: {p.webkit.name}")
        print(f"   - 状态: 正常")
        browser.close()
    
    print("\n🎉 所有浏览器驱动安装成功！")

if __name__ == "__main__":
    verify_installation()
```

运行结果：

```
🔍 开始验证 Playwright 安装...

✅ Chromium:
   - 版本: chromium
   - 状态: 正常

✅ Firefox:
   - 版本: firefox
   - 状态: 正常

✅ WebKit:
   - 版本: webkit
   - 状态: 正常

🎉 所有浏览器驱动安装成功！
```

## Pytest 集成配置

Playwright 可以与 pytest 完美集成，适合测试场景：

### 安装 pytest 插件

```bash
pip install pytest-playwright
```

### 创建 pytest 配置文件

创建 `pytest.ini`：

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
```

### 创建基础测试类

创建 `tests/conftest.py`：

```python
import pytest
from playwright.sync_api import Page, Browser, BrowserContext

@pytest.fixture(scope="session")
def browser(browser_type: Browser):
    """会话级别的浏览器实例"""
    return browser_type

@pytest.fixture(scope="function")
def page(browser: Browser):
    """函数级别的页面实例"""
    context = browser.new_context()
    page = context.new_page()
    yield page
    context.close()

@pytest.fixture(scope="function")
def context(browser: Browser) -> BrowserContext:
    """提供新的浏览器上下文"""
    context = browser.new_context()
    yield context
    context.close()
```

### 创建测试文件

创建 `tests/test_example.py`：

```python
def test_page_title(page):
    """测试页面标题"""
    page.goto("https://example.com")
    assert page.title() == "Example Domain"

def test_navigation(page):
    """测试页面导航"""
    page.goto("https://example.com")
    assert page.url == "https://example.com/"
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_example.py::test_page_title

# 显示详细输出
pytest -v -s
```

## 项目结构组织

### 推荐的项目结构

```
my-playwright-project/
├── playwright_env/          # 虚拟环境
├── tests/                   # 测试文件
│   ├── __init__.py
│   ├── conftest.py         # pytest 配置
│   ├── test_basic.py       # 基础测试
│   ├── test_advanced.py    # 高级测试
│   └── pages/              # 页面对象模型
│       ├── __init__.py
│       ├── home_page.py
│       └── login_page.py
├── pages/                  # 页面对象模型
│   ├── __init__.py
│   ├── base_page.py
│   ├── home_page.py
│   └── login_page.py
├── utils/                  # 工具函数
│   ├── __init__.py
│   ├── helpers.py
│   └── constants.py
├── screenshots/            # 截图保存目录
├── reports/                # 测试报告
├── requirements.txt        # 依赖列表
├── pytest.ini             # pytest 配置
└── run_tests.py           # 测试运行脚本
```

### requirements.txt 示例

```txt
playwright==1.40.0
pytest==7.4.3
pytest-playwright==0.4.3
pytest-html==4.1.1
pytest-xdist==3.5.0
allure-pytest==2.13.2
```

## IDE 配置

### VS Code 配置

创建 `.vscode/settings.json`：

```json
{
    "python.defaultInterpreterPath": "${workspaceFolder}/playwright_env/Scripts/python.exe",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": false,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "python.testing.pytestEnabled": true,
    "python.testing.unittestEnabled": false,
    "editor.formatOnSave": true
}
```

### PyCharm 配置

1. **设置 Python 解释器**
   - File → Settings → Project → Python Interpreter
   - 选择虚拟环境中的 Python

2. **配置 pytest**
   - File → Settings → Tools → Python Integrated Tools
   - Default test runner: pytest

3. **安装插件**
   - Python 插件
   - Atom Material Theme（可选）

## 常用配置选项

### 浏览器启动配置

```python
from playwright.sync_api import sync_playwright

def browser_config_examples():
    with sync_playwright() as p:
        # 基本配置
        browser = p.chromium.launch()
        
        # 有头模式（显示浏览器窗口）
        browser = p.chromium.launch(headless=False)
        
        # 自定义浏览器路径
        browser = p.chromium.launch(
            executable_path="/path/to/chromium"
        )
        
        # 禁用 GPU
        browser = p.chromium.launch(
            args=["--disable-gpu"]
        )
        
        # 禁用自动化提示栏
        browser = p.chromium.launch(
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        # 设置视口大小
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080}
        )
        
        # 设置用户代理
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        
        browser.close()
```

### 上下文配置

```python
def context_config_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 地理位置配置
        context = browser.new_context(
            geolocation={"latitude": 39.9042, "longitude": 116.4074},
            permissions=["geolocation"]
        )
        
        # 模拟设备
        context = browser.new_context(
            **p.devices["iPhone 13"]
        )
        
        # 自定义语言
        context = browser.new_context(
            locale="zh-CN",
            timezone_id="Asia/Shanghai"
        )
        
        # 设置视口和设备比例
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
            device_scale_factor=2
        )
        
        browser.close()
```

## 常见问题解决

### 问题 1：安装超时

```bash
# 使用国内镜像
pip install playwright -i https://pypi.tuna.tsinghua.edu.cn/simple

# 设置浏览器下载镜像
export PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net
playwright install
```

### 问题 2：权限错误（Linux）

```bash
# 添加执行权限
chmod +x ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome
```

### 问题 3：浏览器无法启动

```python
# 清理缓存并重新安装
import subprocess
subprocess.run(["playwright", "install", "--force"])
```

### 问题 4：找不到 Chromium

```python
# 手动指定浏览器路径
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/chromium-browser",
        # 或者 Windows
        # executable_path="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    )
    page = browser.new_page()
    page.goto("https://example.com")
    browser.close()
```

## 更新 Playwright

### 检查当前版本

```python
import playwright
print(playwright.__version__)
```

### 升级到最新版本

```bash
# 升级 Playwright
pip install --upgrade playwright

# 重新安装浏览器驱动
playwright install
```

### 升级特定浏览器

```bash
# 只升级 Chromium
playwright install chromium
```

## Docker 环境配置

### Dockerfile 示例

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libwebkit2gtk-4.0-37 \
    libnss3 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装 Playwright 浏览器
RUN playwright install chromium

# 复制项目文件
COPY . .

# 运行测试
CMD ["pytest"]
```

### docker-compose.yml 示例

```yaml
version: '3.8'

services:
  playwright:
    build: .
    container_name: playwright-test
    volumes:
      - ./tests:/app/tests
      - ./reports:/app/reports
    environment:
      - PYTHONPATH=/app
```

## 性能优化配置

### 并行浏览器启动

```python
from playwright.sync_api import sync_playwright
from concurrent.futures import ThreadPoolExecutor

def run_parallel_tests():
    def test_in_browser(browser_name):
        with sync_playwright() as p:
            browser = getattr(p, browser_name).launch()
            page = browser.new_page()
            page.goto("https://example.com")
            result = page.title()
            browser.close()
            return result
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        browsers = ["chromium", "firefox", "webkit"]
        results = list(executor.map(test_in_browser, browsers))
    
    print(results)

run_parallel_tests()
```

### 浏览器复用

```python
# 在测试会话中复用浏览器实例
@pytest.fixture(scope="session")
def browser_with_context(browser_type: Browser):
    context = browser_type.launch()
    yield context
    context.close()

@pytest.fixture(scope="function")
def page(browser_with_context: Browser, request):
    page = browser_with_context.new_page()
    yield page
    page.close()
```
