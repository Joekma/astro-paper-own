---
title: Selenium 断言与验证
series: selenium
seriesOrder: 8
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: selenium-assertions
description: '详细介绍Selenium中的各种断言方法，包括元素状态、内容、属性验证，以及自定义断言的编写。'
tags:
  - Selenium
  - RPA
  - 断言
  - 验证
draft: false
language: zh-CN
---

## 概述

断言是自动化测试的核心，用于验证预期结果与实际结果是否一致。本教程将详细介绍 Selenium 中的各种断言方法。

### 断言类型

```text
┌─────────────────────────────────────────────────────────────┐
│                      断言类型                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  页面断言   │  │  元素断言   │  │  行为断言   │          │
│  │             │  │             │  │             │          │
│  │  • URL      │  │  • 可见性   │  │  • 点击结果  │          │
│  │  • 标题    │  │  • 文本     │  │  • 提交结果  │          │
│  │  • 当前窗口│  │  • 属性     │  │  • 导航结果  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 页面级断言

### URL 断言

```python
def test_url_assertions(browser):
    browser.get("https://example.com")
    
    # 精确匹配
    assert browser.current_url == "https://example.com/"
    
    # URL 包含
    assert "/products" in browser.current_url
    
    # URL 以特定字符串开头
    assert browser.current_url.startswith("https://example.com")
    
    # URL 匹配正则
    import re
    assert re.match(r"https://example\.com/user/\d+", browser.current_url)
```

### 标题断言

```python
def test_title_assertions(browser):
    browser.get("https://example.com")
    
    # 精确匹配
    assert browser.title == "Example Domain"
    
    # 标题包含
    assert "Example" in browser.title
    
    # 标题匹配
    assert browser.title.startswith("Example")
```

## 元素级断言

### 元素存在性

```python
def test_element_existence(browser):
    browser.get("https://example.com")
    
    # 元素存在
    assert browser.find_element(By.ID, "content").is_enabled()
    
    # 元素不存在（应该抛出异常）
    from selenium.common.exceptions import NoSuchElementException
    try:
        browser.find_element(By.ID, "nonexistent")
        assert False, "应该抛出异常"
    except NoSuchElementException:
        assert True
    
    # 多个元素存在
    elements = browser.find_elements(By.CLASS_NAME, "item")
    assert len(elements) > 0
```

### 元素可见性

```python
def test_element_visibility(browser):
    browser.get("https://example.com")
    
    # 元素可见
    assert browser.find_element(By.ID, "visible-element").is_displayed()
    
    # 元素不可见
    hidden = browser.find_element(By.ID, "hidden-element")
    assert not hidden.is_displayed()
```

### 元素文本内容

```python
def test_element_text(browser):
    browser.get("https://example.com")
    
    # 精确文本匹配
    h1 = browser.find_element(By.TAG_NAME, "h1")
    assert h1.text == "Expected Heading"
    
    # 文本包含
    assert "Expected" in h1.text
    
    # 文本为空
    assert h1.text == ""
    
    # 文本不为空
    assert len(h1.text) > 0
```

### 元素属性

```python
def test_element_attributes(browser):
    browser.get("https://example.com")
    
    link = browser.find_element(By.ID, "my-link")
    
    # 获取属性值
    href = link.get_attribute("href")
    assert href == "https://example.com"
    
    # 属性包含
    assert "example" in href
    
    # 获取多个属性
    button = browser.find_element(By.ID, "submit-btn")
    button_type = button.get_attribute("type")
    button_class = button.get_attribute("class")
    
    assert button_type == "submit"
    assert "primary" in button_class
```

### 元素状态

```python
def test_element_state(browser):
    browser.get("https://example.com/form")
    
    # 元素启用
    enabled_btn = browser.find_element(By.ID, "submit-btn")
    assert enabled_btn.is_enabled()
    
    # 元素禁用
    disabled_btn = browser.find_element(By.ID, "disabled-btn")
    assert not disabled_btn.is_enabled()
    
    # 复选框选中
    checkbox = browser.find_element(By.ID, "agree-checkbox")
    assert checkbox.is_selected()
    
    # 复选框未选中
    unchecked = browser.find_element(By.ID, "optional-checkbox")
    assert not unchecked.is_selected()
```

## CSS 属性断言

```python
def test_css_properties(browser):
    browser.get("https://example.com")
    
    element = browser.find_element(By.ID, "styled-element")
    
    # 获取 CSS 属性
    color = element.value_of_css_property("color")
    font_size = element.value_of_css_property("font-size")
    background = element.value_of_css_property("background-color")
    
    # 验证 CSS 值
    assert "rgb" in color or "#" in color  # 颜色格式
    assert "px" in font_size or "em" in font_size  # 字体大小单位
```

## 表单断言

### 输入框断言

```python
def test_input_fields(browser):
    browser.get("https://example.com/form")
    
    username = browser.find_element(By.NAME, "username")
    email = browser.find_element(By.NAME, "email")
    
    # 获取输入值
    username.send_keys("testuser")
    assert username.get_attribute("value") == "testuser"
    
    # 验证默认值
    assert email.get_attribute("value") == ""
    
    # 验证占位符
    placeholder = username.get_attribute("placeholder")
    assert "username" in placeholder.lower()
```

### 下拉菜单断言

```python
from selenium.webdriver.support.ui import Select

def test_dropdown(browser):
    browser.get("https://example.com/form")
    
    select = Select(browser.find_element(By.ID, "country"))
    
    # 验证选项数量
    assert len(select.options) == 10
    
    # 验证第一个选项
    first_option = select.options[0]
    assert first_option.text == "-- Select --"
    
    # 验证选中项
    select.select_by_visible_text("China")
    selected = select.first_selected_option
    assert selected.text == "China"
```

### 错误消息断言

```python
def test_error_messages(browser):
    browser.get("https://example.com/form")
    
    # 填写无效数据
    browser.find_element(By.NAME, "email").send_keys("invalid-email")
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # 等待错误消息出现
    wait = WebDriverWait(browser, 10)
    error = wait.until(
        EC.visibility_of_element_located((By.CLASS_NAME, "error-message"))
    )
    
    # 验证错误消息内容
    assert "valid email" in error.text.lower()
```

## 自定义断言

### 创建断言辅助函数

```python
def assert_element_text(driver, locator, expected):
    """断言元素文本"""
    element = driver.find_element(*locator)
    actual = element.text
    assert expected == actual, f"期望文本 '{expected}', 实际 '{actual}'"

def assert_element_contains(driver, locator, expected_substring):
    """断言元素包含文本"""
    element = driver.find_element(*locator)
    actual = element.text
    assert expected_substring in actual, f"期望包含 '{expected_substring}', 实际 '{actual}'"

def assert_url_contains(driver, expected):
    """断言 URL 包含"""
    assert expected in driver.current_url, f"URL '{driver.current_url}' 不包含 '{expected}'"

def assert_element_attribute(driver, locator, attribute, expected):
    """断言元素属性"""
    element = driver.find_element(*locator)
    actual = element.get_attribute(attribute)
    assert expected == actual, f"期望属性 '{attribute}' 为 '{expected}', 实际 '{actual}'"
```

### 断言类

```python
class Assertions:
    """断言辅助类"""
    
    def __init__(self, driver):
        self.driver = driver
    
    def assert_title(self, expected):
        """断言页面标题"""
        assert expected in self.driver.title, \
            f"期望标题包含 '{expected}', 实际 '{self.driver.title}'"
    
    def assert_url(self, expected):
        """断言 URL"""
        assert expected in self.driver.current_url, \
            f"期望 URL 包含 '{expected}', 实际 '{self.driver.current_url}'"
    
    def assert_element_visible(self, locator):
        """断言元素可见"""
        element = self.driver.find_element(*locator)
        assert element.is_displayed(), f"元素 {locator} 不可见"
    
    def def assert_element_has_text(self, locator, expected):
        """断言元素文本"""
        element = self.driver.find_element(*locator)
        assert expected in element.text, \
            f"期望文本包含 '{expected}', 实际 '{element.text}'"
    
    def assert_toast_message(self, expected_text, timeout=10):
        """断言提示消息"""
        wait = WebDriverWait(self.driver, timeout)
        toast = wait.until(
            EC.visibility_of_element_located((By.CLASS_NAME, "toast-message"))
        )
        assert expected_text in toast.text, \
            f"期望提示消息包含 '{expected_text}', 实际 '{toast.text}'"
```

## 软断言

### 实现软断言

```python
def soft_assertions(browser):
    """收集多个断言错误"""
    errors = []
    
    try:
        assert "Example" in browser.title
    except AssertionError as e:
        errors.append(f"标题断言失败: {e}")
    
    try:
        element = browser.find_element(By.ID, "content")
        assert element.is_displayed()
    except AssertionError as e:
        errors.append(f"内容元素断言失败: {e}")
    
    try:
        assert "https://example.com" in browser.current_url
    except AssertionError as e:
        errors.append(f"URL 断言失败: {e}")
    
    # 报告所有错误
    if errors:
        error_message = "\n".join(errors)
        raise AssertionError(f"发现 {len(errors)} 个断言错误:\n{error_message}")
```

## 验证模式

### 验证后继续

```python
def verify_and_continue(browser):
    """验证后不中断测试"""
    def verify(condition, message):
        if not condition:
            print(f"⚠️ 警告: {message}")
    
    browser.get("https://example.com")
    
    # 验证（警告而非失败）
    verify("Example" in browser.title, "标题不符合预期")
    
    verify(
        browser.find_element(By.ID, "header").is_displayed(),
        "头部元素不可见"
    )
    
    # 继续执行其他测试步骤
    browser.find_element(By.ID, "search").send_keys("test")
```

## 常见验证场景

### 登录验证

```python
def verify_login(browser):
    browser.get("https://example.com/login")
    
    # 填写登录表单
    browser.find_element(By.ID, "username").send_keys("testuser")
    browser.find_element(By.ID, "password").send_keys("password")
    browser.find_element(By.ID, "login-btn").click()
    
    # 验证登录成功
    wait = WebDriverWait(browser, 10)
    wait.until(EC.url_contains("/dashboard"))
    
    # 验证用户信息
    welcome = browser.find_element(By.CLASS_NAME, "welcome-user")
    assert "testuser" in welcome.text.lower()
    
    # 验证登出按钮出现
    assert browser.find_element(By.ID, "logout-btn").is_displayed()
```

### 表单提交验证

```python
def verify_form_submission(browser):
    browser.get("https://example.com/form")
    
    # 填写表单
    browser.find_element(By.NAME, "name").send_keys("张三")
    browser.find_element(By.NAME, "email").send_keys("zhangsan@example.com")
    browser.find_element(By.NAME, "message").send_keys("测试消息")
    
    # 提交
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # 验证成功消息
    success = browser.find_element(By.CLASS_NAME, "success-message")
    assert success.is_displayed()
    assert "提交成功" in success.text
```

### 数据列表验证

```python
def verify_data_list(browser):
    browser.get("https://example.com/users")
    
    # 等待列表加载
    wait = WebDriverWait(browser, 10)
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "user-item")))
    
    # 获取所有用户
    users = browser.find_elements(By.CLASS_NAME, "user-item")
    assert len(users) > 0, "没有找到用户"
    
    # 验证第一个用户信息
    first_user = users[0]
    name = first_user.find_element(By.CLASS_NAME, "user-name")
    assert len(name.text) > 0, "用户名不能为空"
    
    # 验证分页信息
    pagination = browser.find_element(By.CLASS_NAME, "pagination")
    assert pagination.is_displayed()
```

## 最佳实践

### 清晰的断言消息

```python
# ❌ 不推荐：消息不清晰
assert element.is_displayed()

# ✅ 推荐：包含详细信息
assert element.is_displayed(), f"元素 {locator} 应该是可见的，但当前状态为 {element.is_displayed()}"
```

### 适当的验证时机

```python
# ❌ 不推荐：过早验证
browser.get("https://example.com")
assert "Example" in browser.title  # 页面可能还未加载完成

# ✅ 推荐：等待后再验证
wait = WebDriverWait(browser, 10)
wait.until(EC.title_contains("Example"))
assert "Example" in browser.title
```

### 使用描述性测试名称

```python
# ❌ 不推荐
def test_1(browser):
    pass

def test_login(browser):
    pass

# ✅ 推荐
def test_login_page_displays_username_field(browser):
    pass

def test_user_can_login_with_valid_credentials(browser):
    pass
```
