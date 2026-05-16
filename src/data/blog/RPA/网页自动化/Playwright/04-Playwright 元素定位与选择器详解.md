---
title: Playwright 元素定位与选择器详解
series: playwright
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-locators-selectors
description: '详细介绍Playwright中的各种元素定位策略，包括CSS选择器、XPath、文本定位、角色定位等，以及如何编写可靠的选择器。'
tags:
  - Playwright
  - RPA
  - 选择器
  - 元素定位
draft: false
language: zh-CN
---

## 概述

元素定位是网页自动化的核心技能。Playwright 提供了丰富多样的定位策略，让你能够准确、可靠地找到页面上的任何元素。本教程将详细介绍各种定位方法、选择器语法以及最佳实践。

### 选择器策略概览

| 策略类型 | 语法前缀 | 示例 | 适用场景 |
|---------|---------|------|---------|
| **CSS 选择器** | `css=` | `css=#username` | 通用选择器 |
| **XPath** | `xpath=` | `xpath=//button[@id='submit']` | 复杂层级 |
| **文本内容** | `text=` | `text=登录` | 按钮、链接、标签 |
| **角色定位** | `role=` | `role=button[name='Submit']` | 可访问性 |
| **测试 ID** | `testid=` | `testid=submit-btn` | 稳定定位 |
| **占位符** | `placeholder=` | `placeholder=输入用户名` | 表单输入框 |
| **标签** | `label=` | `label=用户名` | 表单标签关联 |
| **nth** | `nth=` | `button >> nth=2` | nth 选择器 |
| **属性** | `aria-*` | `[aria-label='关闭']` | 无障碍属性 |

## 基础定位方法

### CSS 选择器

CSS 选择器是最常用且性能最好的定位方式：

```python
from playwright.sync_api import sync_playwright

def css_selector_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # ID 选择器
        page.click("#submit-button")
        
        # 类选择器
        page.fill(".input-field", "value")
        
        # 属性选择器
        page.click("button[type='submit']")
        
        # 组合选择器
        page.fill("input.username.required", "user")
        
        # 后代选择器
        page.click("form.login-form .submit-btn")
        
        # 子选择器
        page.click("ul.menu > li:first-child")
        
        # 伪类选择器
        page.click("a:hover")
        page.click("input:focus")
        
        browser.close()
```

### XPath 选择器

XPath 适合处理复杂的 DOM 层级关系：

```python
def xpath_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 基础 XPath
        page.click("xpath=//button[@id='submit']")
        
        # 文本匹配
        page.click("xpath=//button[text()='提交']")
        
        # 包含文本
        page.click("xpath=//button[contains(text(), '提交')]")
        
        # 属性存在
        page.click("xpath=//input[@required]")
        
        # 多条件
        page.click("xpath=//button[@type='submit' and @class='primary']")
        
        # 位置选择
        page.click("xpath=//ul/li[1]")
        page.click("xpath=//ul/li[last()]")
        page.click("xpath=//ul/li[position() > 2]")
        
        # 父元素
        parent = page.locator("xpath=//input[@id='email']/parent::div")
        
        # 祖先元素
        form = page.locator("xpath=//input[@id='email']/ancestor::form")
        
        browser.close()
```

## Playwright Locator API

### Locator vs ElementHandle

Playwright 推荐使用 Locator 而非 ElementHandle：

```text
┌─────────────────────────────────────────────────────────────┐
│                        ElementHandle                        │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ 手动管理的元素引用                                        │
│  ❌ 页面更新后可能失效                                        │
│  ❌ 不支持自动等待                                            │
│  ❌ 不推荐使用                                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         Locator                              │
├─────────────────────────────────────────────────────────────┤
│  ✅ Playwright 推荐的方式                                     │
│  ✅ 自动等待元素就绪                                          │
│  ✅ 支持智能重试                                              │
│  ✅ 每次操作都是最新的元素引用                                │
│  ✅ 异步友好的 API                                            │
└─────────────────────────────────────────────────────────────┘
```

### 基本使用

```python
def locator_basics():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 创建定位器
        submit_btn = page.locator("#submit")
        username_input = page.locator("input[name='username']")
        
        # 使用定位器操作
        submit_btn.click()
        username_input.fill("testuser")
        
        # 获取文本内容
        title = page.locator("h1.title").inner_text()
        
        # 获取属性值
        href = page.locator("a.link").get_attribute("href")
        
        # 检查元素可见性
        is_visible = page.locator(".modal").is_visible()
        
        # 检查元素是否存在
        count = page.locator(".item").count()
        
        browser.close()
```

### 链式定位

```python
def chained_locators():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 定位表单内的输入框
        form = page.locator("form#registration")
        username = form.locator("input[name='username']")
        username.fill("testuser")
        
        # 定位列表中的特定项
        items = page.locator("ul.product-list > li")
        third_item = items.nth(2)
        third_item.click()
        
        # 定位表格中的行
        table = page.locator("table.data-table")
        row = table.locator("tr").filter(has=page.locator("td:has-text('item-5')"))
        row.locator("button.edit").click()
        
        browser.close()
```

## 高级选择器策略

### 文本定位

```python
def text_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 精确文本匹配
        page.click("text=登录")
        
        # 不区分大小写
        page.click("text=Login")
        
        # 部分文本匹配
        page.click("text=了解更多")
        
        # 带通配符
        page.click("text=/取消|确认/")
        
        # 正则表达式
        page.click("text=/^提交.*$/")
        
        # 标签内的文本
        page.locator("button:has-text('提交')").click()
        
        # 带 span 的按钮
        page.locator("button:has(span:text('继续'))").click()
        
        browser.close()
```

### 角色定位（推荐）

Playwright 的角色定位器基于 ARIA 角色，是最可靠的选择器之一：

```python
def role_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 按钮角色
        page.locator("role=button[name='Submit']").click()
        
        # 带图标的按钮
        page.locator("role=button[name='Delete' land]").click()
        
        # 链接角色
        page.locator("role=link[name='Privacy Policy']").click()
        
        # 输入框角色
        page.locator("role=textbox[name='Username']").fill("user")
        
        # 复选框角色
        page.locator("role=checkbox[name='Remember me']").check()
        
        # 单选框角色
        page.locator("role=radio[name='Gender'][value='male']").select_radio()
        
        # 选项卡角色
        page.locator("role=tab[name='Settings']").click()
        
        # 对话框角色
        dialog = page.locator("role=dialog[name='Confirm Delete']")
        dialog.locator("role=button[name='Cancel']").click()
        
        # 表格角色
        page.locator("role=table[name='User Data']")
        
        # 列表角色
        page.locator("role=list[name='Recent Files']")
        
        browser.close()
```

### 测试 ID 定位

```python
def test_id_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 方式1：HTML 属性
        # <button data-testid="submit-btn">Submit</button>
        page.locator("data-testid=submit-btn").click()
        
        # 方式2：Playwright test ID
        # <button aria-label="Submit form" data-testid="submit">Submit</button>
        page.get_by_test_id("submit").click()
        
        # 组合方式
        page.get_by_test_id("username-input").fill("user")
        
        browser.close()
```

### 表单相关选择器

```python
def form_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 占位符定位
        page.locator("placeholder=输入用户名").fill("user")
        page.locator("placeholder=请输入密码").fill("pass")
        
        # Label 关联定位
        page.locator("label:has-text('用户名')").fill("user")
        
        # 标签文本定位
        page.get_by_label("密码").fill("pass")
        
        # Alt 文本（图片按钮）
        page.locator("alt=提交按钮").click()
        
        # Title 属性
        page.locator("[title='Settings']").click()
        
        # Name 属性
        page.locator("[name='email']").fill("test@example.com")
        
        browser.close()
```

## 组合选择器

### 使用 >> 组合

```python
def combined_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 组合多个选择器
        page.click("role=button[name='Submit'] >> visible=true")
        
        # 链式选择
        page.fill("form#login >> input[name='username']", "user")
        
        # 带过滤的选择器
        page.locator("button >> visible").first.click()
        
        # 正向过滤
        page.locator("button:has-text('Save')").click()
        
        # 反向过滤
        page.locator("button").filter(has_not=page.locator("[disabled]")).click()
        
        browser.close()
```

### 过滤和 nth

```python
def filter_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/list")
        
        # 按文本过滤
        items = page.locator("li").filter(has_text="Product")
        
        # 按属性过滤
        buttons = page.locator("button").filter(has=page.locator("[disabled]"))
        
        # 按可见性过滤
        visible_items = page.locator(".item").filter(visible=True)
        
        # 位置选择
        first_item = page.locator("li").first
        last_item = page.locator("li").last
        third_item = page.locator("li").nth(2)
        
        # 取特定位置
        even_items = page.locator("li").nth(0)
        for i in range(0, 10, 2):
            page.locator("li").nth(i).click()
        
        browser.close()
```

## 等待机制与定位

### 自动等待

```python
def auto_waiting():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # Playwright 会自动等待元素可操作
        page.click("#dynamic-button")
        
        # 自动等待直到可见
        page.wait_for_selector("#content", state="visible")
        
        # 自动等待直到隐藏
        page.wait_for_selector(".loading", state="hidden")
        
        # 自动等待直到附加到 DOM
        page.wait_for_selector("#lazy-element", state="attached")
        
        # 自动等待直到消失
        page.wait_for_selector(".modal", state="detached")
        
        browser.close()
```

### 显式等待

```python
def explicit_waiting():
    from playwright.sync_api import timeout
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 等待特定条件
        page.wait_for_selector(
            ".success-message",
            state="visible",
            timeout=5000
        )
        
        # 等待函数返回 True
        page.wait_for_function(
            "() => document.querySelector('.count').textContent === '10'"
        )
        
        # 等待请求完成
        page.wait_for_load_state("networkidle")
        
        # 等待 URL 变化
        page.wait_for_url("**/dashboard")
        
        # 等待响应
        response = page.wait_for_response(
            lambda r: r.url == "https://api.example.com/data"
        )
        
        browser.close()
```

## 可靠的选择器设计

### 选择器优先级

从高到低：

1. **Test ID** (`get_by_test_id()`) - 最稳定，专门为测试设计
2. **Role + Name** (`get_by_role("button", name="Submit")`) - 语义化，可访问性友好
3. **Label + Input** (`get_by_label("Username")`) - 表单最佳选择
4. **Text** (`get_by_text("Submit")`) - 适合按钮和链接
5. **CSS Class/ID** (`#submit-btn`) - 通用但可能变化
6. **XPath** (`xpath=...`) - 灵活但脆弱

### 反模式

```python
# ❌ 避免：脆弱的选择器
page.click("div > div > div > button.btn-primary.btn-lg.mt-3")
page.click('xpath=//*[@id="__layout"]/div/div[2]/div/div/div[1]/form/div[5]/button')
page.click("a[onclick*='delete']")

# ✅ 推荐：稳定的选择器
page.get_by_test_id("delete-user-btn").click()
page.get_by_role("button", name="Delete User").click()
page.get_by_role("button", name="Delete").filter(has_text="确认删除").click()
```

### 最佳实践

```python
def best_practices():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 1. 优先使用语义化选择器
        page.locator("role=button[name='Submit form']").click()
        
        # 2. 添加测试 ID 作为最后防线
        # HTML: <button data-testid="submit-btn">Submit</button>
        page.get_by_test_id("submit-btn").click()
        
        # 3. 使用相对定位增强稳定性
        form = page.locator("form#login")
        form.locator("input[name='username']").fill("user")
        form.locator("input[name='password']").fill("pass")
        
        # 4. 避免使用索引，使用过滤
        # ❌
        page.locator("button").nth(3).click()
        # ✅
        page.locator("button").filter(has_text="Cancel").click()
        
        # 5. 等待元素就绪
        page.wait_for_selector(".data-loaded")
        page.locator("table").locator("tr").count()  # 确保表格已加载
        
        # 6. 验证元素存在性
        if page.locator(".optional-element").count() > 0:
            page.locator(".optional-element").click()
        
        browser.close()
```

## 常见场景示例

### 表格操作

```python
def table_operations():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/users")
        
        # 获取表格所有行
        rows = page.locator("table.users-table tbody tr")
        row_count = rows.count()
        
        # 查找特定行
        target_row = rows.filter(has=page.locator("td:has-text('john@example.com')"))
        
        # 在该行执行操作
        target_row.locator("button.edit").click()
        
        # 处理可编辑表格
        cells = page.locator("table.data-table td[contenteditable='true']")
        cells.nth(0).fill("New Value")
        
        # 获取表头
        headers = page.locator("table th")
        header_texts = [h.inner_text() for h in headers.all()]
        
        browser.close()
```

### 动态列表

```python
def dynamic_list():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/products")
        
        # 等待列表加载
        page.wait_for_selector("ul.product-list li", state="visible")
        
        # 获取所有产品
        products = page.locator("ul.product-list li.product-item")
        
        # 遍历每个产品
        for i in range(products.count()):
            product = products.nth(i)
            name = product.locator(".product-name").inner_text()
            price = product.locator(".product-price").inner_text()
            print(f"{name}: {price}")
            
            # 点击查看详情
            product.locator("a.view-details").click()
            page.wait_for_url("**/product/**")
            
            # 返回列表
            page.go_back()
            page.wait_for_selector("ul.product-list")
        
        browser.close()
```

### 表单填写

```python
def form_filling():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/register")
        
        # 使用标签关联
        page.get_by_label("用户名").fill("testuser")
        page.get_by_label("邮箱").fill("test@example.com")
        page.get_by_label("密码").fill("password123")
        page.get_by_label("确认密码").fill("password123")
        
        # 复选框
        page.get_by_role("checkbox", name="同意服务条款").check()
        page.get_by_role("checkbox", name="订阅新闻").uncheck()
        
        # 单选按钮
        page.get_by_role("radio", name="性别").filter(has_value="male").check()
        
        # 下拉选择
        page.select_option("select#country", "China")
        
        # 日期选择
        page.fill("input[type='date']", "2024-12-31")
        
        # 文件上传
        page.set_input_files("input[type='file']", "path/to/file.pdf")
        
        # 提交表单
        page.get_by_role("button", name="注册").click()
        
        browser.close()
```

## 调试技巧

### 获取选择器

```python
def debugging_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 获取元素计数
        count = page.locator(".item").count()
        print(f"找到 {count} 个元素")
        
        # 获取第一个元素的详细信息
        element = page.locator(".item").first
        print(f"Tag: {element.evaluate('el => el.tagName')}")
        print(f"Text: {element.inner_text()}")
        print(f"HTML: {element.inner_html()}")
        
        # 高亮元素（调试用）
        page.evaluate("""el => {
            el.style.border = '3px solid red';
            el.style.background = 'yellow';
        }""")
        
        # 截图标记
        page.locator(".target").highlight()
        page.screenshot(path="debug.png")
        
        browser.close()
```

### 验证选择器

```python
def validate_selectors():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 检查元素是否存在
        def element_exists(selector):
            return page.locator(selector).count() > 0
        
        print(f"ID 存在: {element_exists('#unique-id')}")
        print(f"类存在: {element_exists('.card')}")
        print(f"文本存在: {element_exists('text=Submit')}")
        
        # 验证选择器唯一性
        unique_btn = page.locator("#submit-btn")
        if unique_btn.count() == 1:
            unique_btn.click()
        else:
            print(f"警告: 找到 {unique_btn.count()} 个匹配元素")
        
        browser.close()
```
