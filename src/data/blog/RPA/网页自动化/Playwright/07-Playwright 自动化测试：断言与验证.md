---
title: Playwright 自动化测试：断言与验证
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-assertions-testing
description: '详细介绍Playwright的断言API和自动化测试实践，包括expect语法、软断言、测试框架集成等。'
tags:
  - Playwright
  - RPA
  - 自动化测试
  - 断言
draft: false
language: zh-CN
---

## 概述

自动化测试的核心是验证——确认网页行为符合预期。Playwright 提供了强大的断言系统，结合 `expect` API，你可以编写清晰、可靠的测试用例。本教程将详细介绍 Playwright 的断言语法和测试最佳实践。

### 断言在测试中的位置

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Flow                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Arrange  │───▶│   Act    │───▶│  Assert  │              │
│  │  准备    │    │   执行   │    │   验证   │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                      │                      │
│                                      ▼                      │
│                               ┌──────────┐                  │
│                               │  报告   │                  │
│                               └──────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## expect API 详解

### 基本语法

```python
from playwright.sync_api import expect, sync_playwright

def expect_basics():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 基本断言
        expect(page.locator("#title")).to_be_visible()
        expect(page.locator("#title")).to_have_text("Welcome")
        
        # 否定断言
        expect(page.locator("#error")).not_to_be_visible()
        expect(page.locator("#title")).not_to_have_text("Error")
        
        browser.close()
```

### 常用断言方法

#### 可见性断言

```python
def visibility_assertions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 元素可见
        expect(page.locator("#visible-element")).to_be_visible()
        
        # 元素不可见
        expect(page.locator("#hidden-element")).to_be_hidden()
        
        # 元素 Attached 到 DOM
        expect(page.locator("#attached-element")).to_be_attached()
        
        # 元素在 DOM 中不存在
        expect(page.locator("#non-existent")).not_to_be_attached()
        
        browser.close()
```

#### 文本内容断言

```python
def text_assertions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 精确匹配文本
        expect(page.locator("#title")).to_have_text("Welcome to Our Site")
        
        # 包含文本
        expect(page.locator("#description")).to_contain_text("Welcome")
        
        # 正则匹配
        expect(page.locator("#email")).to_have_text(re.compile(r"^[a-z]+@example\.com$"))
        
        # 包含文本（正则）
        expect(page.locator("#message")).to_contain_text(re.compile(r"(success|completed)"))
        
        # 获取文本并手动断言
        text = page.locator("#content").inner_text()
        assert "expected text" in text
        
        browser.close()
```

#### 值断言

```python
def value_assertions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 输入框值
        expect(page.locator("input[name='username']")).to_have_value("testuser")
        
        # 输入框值匹配正则
        expect(page.locator("input[name='email']")).to_have_value(re.compile(r"@example\.com"))
        
        # 空值
        expect(page.locator("input[name='comment']")).to_have_value("")
        
        # 获取输入值
        value = page.locator("input[name='username']").input_value()
        assert value == "expected"
        
        browser.close()
```

#### 状态断言

```python
def state_assertions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 元素启用
        expect(page.locator("#submit-btn")).to_be_enabled()
        
        # 元素禁用
        expect(page.locator("#disabled-btn")).to_be_disabled()
        
        # 复选框选中
        expect(page.locator("#agree-checkbox")).to_be_checked()
        
        # 复选框未选中
        expect(page.locator("#optional-checkbox")).not_to_be_checked()
        
        # 单选框选中
        expect(page.locator("input[value='male']")).to_be_checked()
        
        browser.close()
```

#### 属性断言

```python
def attribute_assertions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 元素有特定属性
        expect(page.locator("#link")).to_have_attribute("href", "https://example.com")
        
        # 属性匹配正则
        expect(page.locator("#image")).to_have_attribute("src", re.compile(r"\.jpg$"))
        
        # 获取属性值
        href = page.locator("a.link").get_attribute("href")
        assert href == "https://example.com"
        
        # 检查多个属性
        btn = page.locator("button.submit")
        expect(btn).to_have_attribute("type", "submit")
        expect(btn).to_have_attribute("class", re.compile("btn-primary"))
        
        browser.close()
```

#### 计数断言

```python
def count_assertions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/list")
        
        # 元素计数
        expect(page.locator(".item")).to_have_count(10)
        
        # 至少有几个元素
        assert page.locator(".item").count() >= 10
        
        # 获取实际计数
        count = page.locator(".item").count()
        assert count == 10
        
        browser.close()
```

## pytest 集成

### 安装 pytest

```bash
pip install pytest
```

### 基础测试结构

```python
import pytest
from playwright.sync_api import Page, expect

class TestExampleSite:
    """示例网站测试套件"""
    
    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """每个测试前执行"""
        self.page = page
        self.page.goto("https://example.com")
    
    def test_page_title(self):
        """测试页面标题"""
        expect(self.page).to_have_title("Example Domain")
    
    def test_heading_visible(self):
        """测试标题可见"""
        expect(self.page.locator("h1")).to_be_visible()
    
    def test_link_works(self):
        """测试链接可点击"""
        link = self.page.locator("a >> text=More information")
        expect(link).to_be_visible()
        link.click()
        expect(self.page).to_have_url(re.compile(r"example\.org"))
```

### 创建 conftest.py

```python
import pytest
from playwright.sync_api import sync_playwright, Browser, Page

@pytest.fixture(scope="session")
def browser():
    """会话级别的浏览器"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def context(browser: Browser):
    """函数级别的上下文"""
    context = browser.new_context()
    yield context
    context.close()

@pytest.fixture(scope="function")
def page(context):
    """函数级别的页面"""
    page = context.new_page()
    yield page
    page.close()

@pytest.fixture
def authenticated_page(page: Page):
    """已认证的页面"""
    page.goto("https://example.com/login")
    page.fill("#username", "testuser")
    page.fill("#password", "password123")
    page.click("button[type='submit']")
    page.wait_for_url("**/dashboard")
    return page
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定文件
pytest tests/test_login.py

# 运行特定测试
pytest tests/test_login.py::TestLogin::test_valid_login

# 显示详细输出
pytest -v

# 显示 print 输出
pytest -s

# 生成 HTML 报告
pytest --html=reports/report.html

# 并行运行
pytest -n auto
```

## 软断言

### 非致命断言

```python
def soft_assertions():
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 方法1：手动收集多个失败
        failures = []
        
        try:
            assert page.locator("#title").inner_text() == "Expected"
        except AssertionError as e:
            failures.append(f"标题: {e}")
        
        try:
            assert page.locator("#subtitle").inner_text() == "Expected Subtitle"
        except AssertionError as e:
            failures.append(f"副标题: {e}")
        
        try:
            assert page.locator("#link").get_attribute("href") == "https://expected.com"
        except AssertionError as e:
            failures.append(f"链接: {e}")
        
        # 最后统一报告
        if failures:
            print(f"发现 {len(failures)} 个问题:")
            for failure in failures:
                print(f"  - {failure}")
        
        browser.close()
```

### 使用 pytest 软断言

```python
import pytest

def test_multiple_checks(page):
    """收集多个断言失败"""
    page.goto("https://example.com")
    
    # 使用 pytest 的上下文管理器
    with pytest.collect():
        expect(page.locator("#h1")).to_have_text("Example Domain")
        expect(page.locator("#link")).to_have_attribute("href", "https://www.iana.org/domains/example")
        expect(page.locator("#paragraph")).to_contain_text("Internet")
```

## 高级测试模式

### 页面对象模式

```python
class LoginPage:
    """登录页面对象"""
    
    def __init__(self, page):
        self.page = page
        self.username_input = page.locator("#username")
        self.password_input = page.locator("#password")
        self.submit_btn = page.locator("button[type='submit']")
        self.error_msg = page.locator(".error-message")
        self.success_msg = page.locator(".success-message")
    
    def goto(self):
        self.page.goto("https://example.com/login")
    
    def login(self, username, password):
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.submit_btn.click()
    
    def expect_error(self, message):
        expect(self.error_msg).to_contain_text(message)
    
    def expect_success(self):
        expect(self.success_msg).to_be_visible()


class DashboardPage:
    """仪表盘页面对象"""
    
    def __init__(self, page):
        self.page = page
        self.user_info = page.locator(".user-info")
        self.logout_btn = page.locator("button.logout")
    
    def expect_logged_in(self, username):
        expect(self.user_info).to_contain_text(username)


# 测试中使用
def test_login_flow(page):
    login_page = LoginPage(page)
    dashboard_page = DashboardPage(page)
    
    login_page.goto()
    login_page.login("testuser", "password123")
    
    page.wait_for_url("**/dashboard")
    dashboard_page.expect_logged_in("testuser")
```

### 参数化测试

```python
import pytest
from playwright.sync_api import expect

@pytest.mark.parametrize("username,password,should_succeed", [
    ("user1", "pass1", True),
    ("user2", "pass2", True),
    ("invalid", "wrong", False),
    ("", "password", False),
    ("user", "", False),
])
def test_login_combinations(page, username, password, should_succeed):
    page.goto("https://example.com/login")
    page.fill("#username", username)
    page.fill("#password", password)
    page.click("button[type='submit']")
    
    if should_succeed:
        expect(page).to_have_url(re.compile(r"dashboard"))
    else:
        expect(page.locator(".error")).to_be_visible()
```

### 跳过和条件执行

```python
@pytest.mark.skip(reason="功能未实现")
def test_future_feature(page):
    pass

@pytest.mark.skipif(True, reason="CI 环境跳过")
def test_browser_feature(page):
    pass

@pytest.mark.xfail(reason="已知问题")
def test_known_issue(page):
    expect(page.locator("#broken")).to_be_visible()

@pytest.mark.skip_browser("firefox", reason="Firefox 不支持")
def test_chrome_only_feature(page):
    pass

@pytest.mark.only_browser("chromium")
def test_chromium_feature(page):
    pass
```

## 测试报告

### 使用 Allure 生成报告

```bash
pip install allure-pytest
```

```python
import allure
from playwright.sync_api import expect

def test_with_allure_reporting():
    """带有详细报告的测试"""
    with allure.step("打开页面"):
        page.goto("https://example.com")
    
    with allure.step("验证页面标题"):
        expect(page).to_have_title("Example Domain")
        allure.attach(
            page.screenshot(),
            name="page_screenshot",
            attachment_type=allure.attachment_type.PNG
        )
    
    with allure.step("验证主要内容"):
        heading = page.locator("h1")
        expect(heading).to_be_visible()
        allure.attach(
            heading.inner_text(),
            name="heading_text",
            attachment_type=allure.attachment_type.TEXT
        )
```

### 运行并生成报告

```bash
# 运行测试并生成报告
pytest --alluredir=./allure-results

# 生成 HTML 报告
allure serve ./allure-results
```

## 测试夹具

### 浏览器夹具

```python
# conftest.py
@pytest.fixture(scope="session")
def browser():
    """跨浏览器测试"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        yield browser
        browser.close()

@pytest.fixture(params=["chromium", "firefox", "webkit"])
def all_browsers(request, browser):
    """参数化浏览器测试"""
    return browser
```

### 数据夹具

```python
# test_data.py
TEST_USERS = [
    {"username": "admin", "password": "admin123", "role": "admin"},
    {"username": "user1", "password": "user123", "role": "user"},
    {"username": "guest", "password": "guest", "role": "guest"},
]

@pytest.fixture(params=TEST_USERS)
def user_credentials(request):
    """用户数据夹具"""
    return request.param

def test_login_with_different_users(page, user_credentials):
    """测试不同用户的登录"""
    page.goto("https://example.com/login")
    page.fill("#username", user_credentials["username"])
    page.fill("#password", user_credentials["password"])
    page.click("button[type='submit']")
    expect(page.locator(".user-role")).to_contain_text(user_credentials["role"])
```

## 钩子函数

### 测试生命周期

```python
# conftest.py

def pytest_configure(config):
    """测试配置钩子"""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")

@pytest.fixture(scope="session")
def browser():
    """会话开始"""
    print("启动浏览器...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        yield browser
        print("关闭浏览器...")
        browser.close()

@pytest.fixture(scope="function")
def page(browser):
    """测试开始"""
    print("创建新页面...")
    context = browser.new_context()
    page = context.new_page()
    yield page
    print("关闭页面...")
    page.close()
    context.close()

def pytest_runtest_makereport(item, call):
    """测试报告钩子"""
    if call.when == "call":
        if call.excinfo is not None:
            print(f"测试失败: {item.name}")
```

## 最佳实践

### 测试组织

```python
class TestNavigation:
    """导航测试"""
    
    def test_homepage_loads(self, page):
        page.goto("https://example.com")
        expect(page).to_have_title("Example Domain")
    
    def test_navigation_links(self, page):
        page.goto("https://example.com")
        page.click("text=More information")
        expect(page).to_have_url(re.compile(r"example\.org"))

class TestForms:
    """表单测试"""
    
    def test_form_validation(self, page):
        page.goto("https://example.com/form")
        page.click("button[type='submit']")
        expect(page.locator(".error")).to_be_visible()
    
    def test_form_submission(self, page):
        page.goto("https://example.com/form")
        page.fill("input[name='email']", "test@example.com")
        page.click("button[type='submit']")
        expect(page.locator(".success")).to_be_visible()

class TestUserFlows:
    """用户流程测试"""
    
    def test_complete_purchase_flow(self, page):
        """完整的购买流程"""
        # 1. 浏览商品
        page.goto("https://shop.example.com")
        page.click(".product:first-child")
        
        # 2. 添加购物车
        page.click(".add-to-cart")
        expect(page.locator(".cart-count")).to_have_text("1")
        
        # 3. 结账
        page.click(".checkout")
        page.fill("#email", "buyer@example.com")
        page.fill("#card", "4242424242424242")
        page.click(".pay")
        
        # 4. 验证订单
        expect(page.locator(".order-confirmation")).to_be_visible()
```

### 命名规范

```python
# ✅ 好的命名
def test_login_page_displays_username_field():
    pass

def test_user_can_login_with_valid_credentials():
    pass

def test_login_fails_with_invalid_password():
    pass

def test_shopping_cart_updates_quantity_correctly():
    pass

# ❌ 差的命名
def test_login():
    pass

def test_form():
    pass

def test_button():
    pass
```

### 断言最佳实践

```python
def assertion_best_practices():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # ✅ 使用 expect（推荐）
        expect(page.locator("#title")).to_have_text("Expected Title")
        
        # ✅ 提供有意义的错误信息
        assert page.title() == "Expected", f"期望标题为'Expected'，实际为'{page.title()}'"
        
        # ✅ 使用精确的选择器
        expect(page.locator("#main-form button.submit")).to_be_enabled()
        
        # ✅ 组合多个条件
        element = page.locator("#complex-widget")
        expect(element).to_be_visible()
        expect(element).to_have_attribute("data-state", "active")
        
        # ⚠️ 避免无意义的断言
        # ❌ assert True
        # ❌ assert 1 == 1
        
        browser.close()
```

## 调试测试

### 截图和跟踪

```python
def debugging_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 失败时自动截图
        try:
            expect(page.locator("#title")).to_have_text("Wrong Title")
        except AssertionError:
            page.screenshot(path="debug.png")
            raise
        
        # 捕获控制台日志
        page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))
        
        # 捕获网络请求
        page.on("request", lambda req: print(f"Request: {req.url}"))
        page.on("response", lambda res: print(f"Response: {res.status}"))
        
        browser.close()
```

### Playwright 追踪查看器

```python
from playwright.sync_api import sync_playwright

def trace_viewer_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        
        # 开始追踪
        context.tracing.start(
            screenshots=True,
            snapshots=True,
            sources=True
        )
        
        page = context.new_page()
        page.goto("https://example.com")
        page.fill("#username", "testuser")
        page.click("#submit")
        
        # 停止追踪
        context.tracing.stop(path="trace.zip")
        
        # 使用 `npx playwright show-trace trace.zip` 查看
        
        browser.close()
```
