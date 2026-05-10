---
title: Selenium 开发环境配置与安装
series: selenium
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: selenium-installation
description: '详细介绍Selenium的各种安装方式，包括Python、Java环境配置，以及各种浏览器的驱动安装和管理。'
tags:
  - Selenium
  - RPA
  - 安装配置
  - 开发环境
draft: false
language: zh-CN
---

## 概述

Selenium 支持多种编程语言，包括 Python、Java、C#、JavaScript 等。本教程以 Python 为主要示例，同时提供其他语言的简要说明。

### 系统要求

| 要求 | 说明 |
|------|------|
| **操作系统** | Windows 7+, macOS 10.12+, Linux |
| **Python** | 3.6 或更高版本 |
| **内存** | 至少 4GB RAM |
| **浏览器** | Chrome 71+, Firefox 60+, Edge 79+ |

## Python 环境配置

### 使用 pip 安装

Selenium 可以通过 pip 直接安装：

```bash
# 安装 Selenium
pip install selenium

# 验证安装
python -c "import selenium; print(selenium.__version__)"
```

### 创建虚拟环境（推荐）

创建虚拟环境可以隔离项目依赖，避免版本冲突：

```bash
# 创建虚拟环境
python -m venv selenium-env

# 激活虚拟环境
# Windows
selenium-env\Scripts\activate

# macOS/Linux
source selenium-env/bin/activate

# 安装 Selenium
pip install selenium
```

### Conda 环境

```bash
# 创建 conda 环境
conda create -n selenium-env python=3.11

# 激活环境
conda activate selenium-env

# 安装 Selenium
pip install selenium
```

## 浏览器驱动安装

### ChromeDriver 安装

#### 方式一：从官网下载

1. 访问 [ChromeDriver 下载页面](https://chromedriver.chromium.org/downloads)
2. 选择与你的 Chrome 浏览器版本匹配的驱动
3. 下载对应平台的压缩包
4. 解压并放置到系统 PATH 目录

```bash
# Windows: C:\Program Files\ 或添加到 PATH
# macOS/Linux: /usr/local/bin/ 或 ~/bin/
```

#### 方式二：使用 webdriver-manager（推荐）

webdriver-manager 可以自动管理驱动版本：

```bash
pip install webdriver-manager
```

```python
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# 自动下载和管理 ChromeDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
```

### Firefox GeckoDriver 安装

```bash
pip install webdriver-manager
```

```python
from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from webdriver_manager.firefox import GeckoDriverManager

service = Service(GeckoDriverManager().install())
driver = webdriver.Firefox(service=service)
```

### Edge WebDriver 安装

```bash
pip install webdriver-manager
```

```python
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from webdriver_manager.microsoft import EdgeChromiumDriverManager

service = Service(EdgeChromiumDriverManager().install())
driver = webdriver.Edge(service=service)
```

### Safari WebDriver

Safari 的 WebDriver 是内置的，只需启用即可：

```bash
# 在终端执行
safaridriver --enable
```

```python
from selenium import webdriver

driver = webdriver.Safari()
```

## 验证安装

### 创建验证脚本

```python
from selenium import webdriver
from selenium.webdriver.common.by import By

def verify_installation():
    print("🔍 开始验证 Selenium 安装...\n")
    
    # 测试 Chrome
    print("✅ Chrome:")
    try:
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service)
        driver.get("data:text/html,<h1>Hello from Chrome</h1>")
        print(f"   - 状态: 正常")
        driver.quit()
    except Exception as e:
        print(f"   - 错误: {e}")
    
    print("\n✅ Firefox:")
    try:
        from selenium.webdriver.firefox.service import Service
        from webdriver_manager.firefox import GeckoDriverManager
        
        service = Service(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=service)
        driver.get("data:text/html,<h1>Hello from Firefox</h1>")
        print(f"   - 状态: 正常")
        driver.quit()
    except Exception as e:
        print(f"   - 错误: {e}")
    
    print("\n🎉 安装验证完成！")

if __name__ == "__main__":
    verify_installation()
```

### 运行验证脚本

```bash
python verify_selenium.py
```

输出示例：

```
🔍 开始验证 Selenium 安装...

✅ Chrome:
   - 状态: 正常

✅ Firefox:
   - 状态: 正常

🎉 安装验证完成！
```

## 其他语言环境

### Java 环境

#### Maven 依赖

```xml
<dependencies>
    <dependency>
        <groupId>org.seleniumhq.selenium</groupId>
        <artifactId>selenium-java</artifactId>
        <version>4.15.0</version>
    </dependency>
</dependencies>
```

#### Gradle 依赖

```gradle
dependencies {
    implementation 'org.seleniumhq.selenium:selenium-java:4.15.0'
}
```

#### Java 示例

```java
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class SeleniumDemo {
    public static void main(String[] args) {
        WebDriver driver = new ChromeDriver();
        driver.get("https://example.com");
        System.out.println(driver.getTitle());
        driver.quit();
    }
}
```

### JavaScript (Node.js) 环境

#### npm 安装

```bash
npm install selenium-webdriver
```

#### JavaScript 示例

```javascript
const { Builder } = require('selenium-webdriver');

async function demo() {
    let driver = await new Builder()
        .forBrowser('chrome')
        .build();
    
    await driver.get('https://example.com');
    console.log(await driver.getTitle());
    await driver.quit();
}

demo();
```

### C# 环境

#### NuGet 包

```bash
dotnet add package Selenium.WebDriver
```

#### C# 示例

```csharp
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;

class Program {
    static void Main() {
        IWebDriver driver = new ChromeDriver();
        driver.Navigate().GoToUrl("https://example.com");
        Console.WriteLine(driver.Title);
        driver.Quit();
    }
}
```

## 浏览器配置

### Chrome 选项

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# 创建选项
options = Options()

# 无头模式
options.add_argument("--headless")

# 禁用 GPU
options.add_argument("--disable-gpu")

# 禁用自动化提示
options.add_argument("--disable-blink-features=AutomationControlled")

# 设置视口大小
options.add_argument("--window-size=1920,1080")

# 设置用户代理
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

# 禁用图片加载（加速）
prefs = {"profile.managed_default_content_settings.images": 2}
options.add_experimental_option("prefs", prefs)

# 创建驱动
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)
```

### Firefox 选项

```python
from selenium import webdriver
from selenium.webdriver.firefox.options import Options

options = Options()

# 无头模式
options.add_argument("--headless")

# 设置视口
options.add_argument("--width=1920")
options.add_argument("--height=1080")

# 创建驱动
driver = webdriver.Firefox(options=options)
```

### Edge 选项

```python
from selenium import webdriver
from selenium.webdriver.edge.options import Options

options = Options()

# 无头模式
options.add_argument("--headless")

# 创建驱动
driver = webdriver.Edge(options=options)
```

## pytest 集成

### 安装 pytest

```bash
pip install pytest pytest-selenium
```

### 创建测试配置

```python
# conftest.py
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="session")
def browser():
    """浏览器会话级 fixture"""
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    yield driver
    driver.quit()

@pytest.fixture
def home_page(browser):
    """访问首页"""
    browser.get("https://example.com")
    return browser
```

### 创建测试文件

```python
# test_example.py
def test_page_title(home_page):
    """测试页面标题"""
    assert "Example Domain" in home_page.title

def test_search_box_exists(home_page):
    """测试搜索框存在"""
    assert home_page.find_element(By.NAME, "q") is not None
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest test_example.py

# 显示详细输出
pytest -v

# 显示 print 输出
pytest -s
```

## 项目结构

### 推荐的目录结构

```
selenium-project/
├── tests/                    # 测试文件
│   ├── __init__.py
│   ├── conftest.py          # pytest 配置
│   ├── test_login.py        # 登录测试
│   ├── test_search.py       # 搜索测试
│   └── page_objects/         # 页面对象
│       ├── __init__.py
│       ├── base_page.py
│       ├── login_page.py
│       └── home_page.py
├── pages/                   # 页面对象模型
│   └── __init__.py
├── utils/                   # 工具函数
│   ├── __init__.py
│   ├── helpers.py
│   └── constants.py
├── screenshots/             # 截图保存
├── reports/                 # 测试报告
├── requirements.txt         # 依赖
└── pytest.ini             # pytest 配置
```

### requirements.txt 示例

```txt
selenium==4.15.0
webdriver-manager==4.0.1
pytest==7.4.3
pytest-html==4.1.1
pytest-xdist==3.5.0
allure-pytest==2.13.2
```

## 常见问题解决

### 问题 1：驱动版本不匹配

```
SessionNotCreatedException: This version of ChromeDriver only supports Chrome version XX
```

**解决方法：**

```bash
# 更新 Selenium
pip install --upgrade selenium

# 使用 webdriver-manager 自动管理
pip install webdriver-manager
```

### 问题 2：权限错误（Linux/macOS）

```
PermissionError: [Errno 13] Permission denied
```

**解决方法：**

```bash
# 添加执行权限
chmod +x chromedriver

# 移动到系统 PATH
sudo mv chromedriver /usr/local/bin/
```

### 问题 3：无法启动浏览器

```
WebDriverException: chrome not reachable
```

**解决方法：**

```python
# 使用正确的 Chrome 路径
options.binary_location = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
driver = webdriver.Chrome(options=options)
```

### 问题 4：超时错误

```
TimeoutException: Message: timeout
```

**解决方法：**

```python
# 增加超时时间
driver.set_page_load_timeout(30)

# 或使用 try-except
from selenium.webdriver.support.ui import WebDriverWait

try:
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "myElement"))
    )
except TimeoutException:
    print("元素查找超时")
```

## Docker 环境配置

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 运行测试
CMD ["pytest"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  selenium:
    build: .
    container_name: selenium-tests
    volumes:
      - ./tests:/app/tests
      - ./reports:/app/reports
    environment:
      - PYTHONPATH=/app
    shm_size: '2gb'
```

## 更新 Selenium

### 检查版本

```python
import selenium
print(selenium.__version__)
```

### 升级

```bash
# 升级 Selenium
pip install --upgrade selenium

# 升级 webdriver-manager
pip install --upgrade webdriver-manager
```

## 总结

完成环境配置后，你就可以开始使用 Selenium 进行网页自动化了。本教程涵盖了：

✅ Python 环境配置
✅ 虚拟环境使用
✅ 浏览器驱动安装
✅ webdriver-manager 使用
✅ 多语言环境配置
✅ 浏览器选项配置
✅ pytest 集成
✅ 项目结构组织
✅ Docker 环境配置
✅ 常见问题解决
