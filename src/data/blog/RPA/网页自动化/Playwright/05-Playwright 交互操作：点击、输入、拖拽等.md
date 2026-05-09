---
title: Playwright 交互操作：点击、输入、拖拽等
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-interactions
description: '详细介绍Playwright中的各种用户交互操作，包括鼠标点击、键盘输入、拖拽、滚动、表单操作等，以及高级交互技巧。'
tags:
  - Playwright
  - RPA
  - 交互操作
  - 自动化
draft: false
language: zh-CN
---

## 概述

网页自动化最核心的部分就是模拟用户的各种交互操作。Playwright 提供了丰富的 API 来模拟真实用户的点击、输入、拖拽、滚动等行为。本教程将详细介绍这些交互操作的用法和技巧。

### 交互操作分类

| 类型 | 操作 | 说明 |
|------|------|------|
| **鼠标操作** | click, dblclick, hover, drag | 模拟鼠标事件 |
| **键盘操作** | type, press, fill | 模拟键盘输入 |
| **表单操作** | fill, select, check | 表单元素操作 |
| **滚动操作** | scroll, scroll_into_view | 页面滚动 |
| **触控操作** | tap, swipe | 移动设备模拟 |
| **高级操作** | drag_drop, multi_select | 复杂交互 |

## 鼠标操作

### 基本点击

```python
from playwright.sync_api import sync_playwright

def basic_click_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 基本点击
        page.click("#submit-btn")
        
        # 指定鼠标按钮
        page.click("#element", button="left")   # 左键
        page.click("#element", button="right")  # 右键
        page.click("#element", button="middle")  # 中键
        
        # 点击并等待
        page.click("#async-btn", wait_after_click=True)
        
        # 双击
        page.dblclick("#edit-btn")
        
        # 三击（选中整段）
        page.click("#text-paragraph", click_count=3)
        
        browser.close()
```

### 点击选项

```python
def click_options():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 精确点击元素中心
        page.click("#btn", position={"x": 0, "y": 0})
        
        # 延迟点击（毫秒）
        page.click("#delayed-btn", delay=1000)
        
        # 点击时按住修饰键
        page.click("#link", modifiers=["Shift"])
        page.click("#link", modifiers=["Control"])
        page.click("#link", modifiers=["Alt"])
        page.click("#link", modifiers=["Meta"])  # Windows: Win, Mac: Cmd
        
        # 组合修饰键
        page.click("#link", modifiers=["Shift", "Control"])
        
        # 强制点击（跳过可操作性检查）
        page.click("#disabled-btn", force=True)
        
        # 点击并等待新页面
        with page.context.expect_page() as new_page_info:
            page.click("a[target='_blank']")
        new_page = new_page_info.value
        
        browser.close()
```

### 悬停和移动

```python
def hover_and_move():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 悬停
        page.hover("#dropdown-menu")
        
        # 悬停到指定位置
        page.hover("#menu-item", position={"x": 10, "y": 10})
        
        # 移动鼠标
        page.mouse.move(100, 200)
        page.mouse.move(200, 300)
        
        # 按下和释放鼠标
        page.mouse.down()
        page.mouse.move(300, 400)
        page.mouse.up()
        
        # 跟踪鼠标移动路径
        page.mouse.move(0, 0)
        page.mouse.move(100, 100)
        page.mouse.move(100, 200)
        
        browser.close()
```

### 拖拽操作

```python
def drag_operations():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/drag")
        
        # 方法1：使用 drag_and_drop
        page.drag_and_drop("#draggable", "#dropzone")
        
        # 方法2：手动拖拽
        source = page.locator("#draggable")
        target = page.locator("#dropzone")
        
        # 获取元素位置
        source_box = source.bounding_box()
        target_box = target.bounding_box()
        
        if source_box and target_box:
            # 从源中心拖到目标中心
            page.mouse.move(
                source_box['x'] + source_box['width'] / 2,
                source_box['y'] + source_box['height'] / 2
            )
            page.mouse.down()
            page.mouse.move(
                target_box['x'] + target_box['width'] / 2,
                target_box['y'] + target_box['height'] / 2,
                steps=10  # 分步移动，更真实
            )
            page.mouse.up()
        
        # 方法3：使用 drag_to
        source.drag_to(target)
        
        browser.close()
```

## 键盘操作

### 基本输入

```python
def basic_keyboard():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 聚焦并输入
        page.click("input[name='username']")
        page.keyboard.type("testuser")
        
        # 快速填充（自动聚焦并清空）
        page.fill("input[name='username']", "testuser")
        
        # 按键
        page.press("input[name='username']", "Enter")
        page.press("input[name='username']", "Tab")
        page.press("input[name='username']", "Escape")
        
        # 特殊键
        page.press("body", "Control+a")
        page.press("body", "Control+c")
        page.press("body", "Control+v")
        page.press("body", "Backspace")
        page.press("body", "Delete")
        
        browser.close()
```

### 高级键盘操作

```python
def advanced_keyboard():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 输入带修饰键
        page.keyboard.press("Control+a")
        page.keyboard.press("Control+c")
        page.keyboard.press("Control+v")
        
        # 组合快捷键
        page.keyboard.press("Control+Shift+a")
        page.keyboard.press("Alt+F4")
        page.keyboard.press("Command+s")  # Mac
        
        # 输入中文（需要切换输入法）
        page.keyboard.type("你好世界")
        
        # 模拟松开所有键
        page.keyboard.up("Control")
        page.keyboard.up("Shift")
        
        # 按下但不放
        page.keyboard.down("Control")
        page.click("#multi-select")
        page.keyboard.up("Control")
        
        # 输入 Unicode 字符
        page.keyboard.insert_text("🎉")
        page.keyboard.insert_text("✅")
        
        browser.close()
```

### 常用快捷键映射

| 快捷键 | 写法 |
|--------|------|
| 全选 | `Control+a` |
| 复制 | `Control+c` |
| 粘贴 | `Control+v` |
| 剪切 | `Control+x` |
| 撤销 | `Control+z` |
| 重做 | `Control+Shift+z` |
| 保存 | `Control+s` |
| 刷新 | `F5` |
| 关闭 | `Alt+F4` |
| Tab | `Tab` |
| Enter | `Enter` |
| Esc | `Escape` |

## 表单操作

### 文本输入

```python
def text_input_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 基本填充
        page.fill("input[name='username']", "testuser")
        
        # 追加输入
        page.fill("input[name='username']", "prefix_")
        page.locator("input[name='username']").press("End")
        page.type("input[name='username']", "_suffix")
        
        # 清空并输入
        page.fill("input[name='username']", "")
        page.type("input[name='username']", "cleared_and_typed")
        
        # 输入密码（隐藏输入）
        page.fill("input[type='password']", "secret123")
        
        # 多行文本
        page.fill("textarea[name='description']", "Line 1\nLine 2\nLine 3")
        
        # 富文本编辑器
        page.locator(".rich-editor").click()
        page.keyboard.type("Bold text")
        page.keyboard.press("Control+a")
        page.keyboard.press("Control+b")
        
        browser.close()
```

### 复选框和单选框

```python
def checkbox_radio_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 复选框操作
        page.check("#agree-terms")
        page.uncheck("#subscribe-newsletter")
        
        # 切换状态
        checkbox = page.locator("#toggle-option")
        is_checked = checkbox.is_checked()
        if is_checked:
            checkbox.uncheck()
        else:
            checkbox.check()
        
        # 验证复选框状态
        assert page.locator("#agree-terms").is_checked()
        
        # 单选框操作
        page.check("input[value='male']")
        page.check("input[value='female']")
        
        # 使用选择器
        page.locator("input[type='radio'][name='gender']").check()
        
        # 验证单选框状态
        assert page.locator("input[value='male']").is_checked()
        
        browser.close()
```

### 下拉选择

```python
def select_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 按值选择
        page.select_option("select#country", "CN")
        
        # 按标签文本选择
        page.select_option("select#country", label="中国")
        
        # 按索引选择
        page.select_option("select#country", index=1)
        
        # 多选
        page.select_option("select#languages", ["Python", "JavaScript"])
        
        # 移除选择
        page.select_option("select#languages", [])
        
        # 使用定位器
        page.locator("select#country").select_option("US")
        
        # 验证选择
        selected = page.locator("select#country").input_value()
        assert selected == "US"
        
        # 获取所有选中项
        selected_options = page.locator("select#languages").evaluate(
            "el => Array.from(el.selectedOptions).map(o => o.value)"
        )
        
        browser.close()
```

### 文件上传

```python
def file_upload_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        # 基本文件上传
        page.set_input_files("input[type='file']", "path/to/file.pdf")
        
        # 多文件上传
        page.set_input_files(
            "input[type='file']",
            ["file1.pdf", "file2.pdf", "file3.pdf"]
        )
        
        # 清空文件选择
        page.set_input_files("input[type='file']", [])
        
        # 拖拽上传区域
        with page.locator(".upload-zone").drag_over():
            page.locator(".upload-zone").set_input_files("file.pdf")
        
        # 验证上传
        page.wait_for_selector(".upload-success")
        
        # 下载文件（使用文件对话框）
        with page.expect_download() as download_info:
            page.click("button.download")
        download = download_info.value
        path = download.path()
        print(f"下载文件保存至: {path}")
        
        browser.close()
```

### 日期和时间选择

```python
def date_time_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 直接填充日期
        page.fill("input[type='date']", "2024-12-25")
        page.fill("input[type='datetime-local']", "2024-12-25T10:30:00")
        page.fill("input[type='time']", "14:30")
        
        # 使用日期选择器（点击选择）
        page.click("input[type='date']")
        page.wait_for_selector(".date-picker")
        
        # 选择月份
        page.click(".date-picker .month-nav >> text=Next")
        
        # 选择年份
        page.click(".date-picker .year-select")
        page.click(".year-picker >> text=2025")
        
        # 选择日期
        page.click(".date-picker >> text=25")
        
        # 清空日期
        page.locator("input[type='date']").fill("")
        
        browser.close()
```

## 滚动操作

### 页面滚动

```python
def scroll_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/long-page")
        
        # 滚动到顶部
        page.evaluate("window.scrollTo(0, 0)")
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        
        # 滚动到底部
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})")
        
        # 滚动到指定位置
        page.evaluate("window.scrollTo(0, 500)")
        
        # 滚动到元素
        page.locator("#footer").scroll_into_view_if_needed()
        
        # 滚动一定距离
        page.evaluate("window.scrollBy(0, 500)")
        
        # 逐屏滚动
        for _ in range(5):
            page.keyboard.press("PageDown")
            page.wait_for_timeout(200)
        
        browser.close()
```

### 使用 Locator 滚动

```python
def locator_scroll():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/long-page")
        
        # 滚动使元素可见
        page.locator("#target-element").scroll_into_view()
        
        # 滚动使元素可见（带偏移）
        page.locator("#target-element").scroll_into_view_if_needed()
        
        # 滚动到元素中心
        page.locator("#target-element").scroll_to()
        
        # 获取元素位置
        box = page.locator("#element").bounding_box()
        if box:
            page.evaluate(f"window.scrollTo(0, {box['y'] - 100})")
        
        browser.close()
```

## 高级交互

### 组合操作

```python
def combined_operations():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 完整登录流程
        page.fill("input[name='username']", "testuser")
        page.fill("input[name='password']", "password123")
        page.check("input[name='remember']")
        page.click("button[type='submit']")
        
        # 等待导航完成
        page.wait_for_url("**/dashboard", timeout=5000)
        
        # 搜索并选择
        page.fill("input[type='search']", "关键词")
        page.wait_for_selector(".search-results")
        page.locator(".search-results .result >> nth=0").click()
        
        # 表格行操作
        page.locator("table tr").filter(has_text="John").locator("button.edit").click()
        
        browser.close()
```

### 等待交互完成

```python
def wait_for_interactions():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 点击并等待网络请求完成
        with page.expect_request("**/api/submit"):
            page.click("#submit-btn")
        
        # 点击并等待响应
        response = page.wait_for_response("**/api/**")
        print(f"响应状态: {response.status}")
        
        # 点击并等待导航
        page.click("#link")
        page.wait_for_load_state("networkidle")
        
        # 点击并等待元素消失
        page.click("#loading-btn")
        page.wait_for_selector(".loading", state="hidden")
        
        # 点击并等待元素出现
        page.click("#trigger-modal")
        page.wait_for_selector(".modal", state="visible")
        
        browser.close()
```

### 模拟真实用户行为

```python
def realistic_behavior():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 模拟打字速度（逐字输入）
        page.click("input[name='username']")
        for char in "testuser":
            page.keyboard.type(char)
            page.wait_for_timeout(50)  # 模拟打字延迟
        
        # 模拟鼠标轨迹
        start = page.locator("#start").bounding_box()
        end = page.locator("#end").bounding_box()
        
        if start and end:
            # 生成鼠标轨迹点
            import random
            points = []
            for i in range(20):
                x = start['x'] + (end['x'] - start['x']) * i / 20 + random.randint(-5, 5)
                y = start['y'] + (end['y'] - start['y']) * i / 20 + random.randint(-5, 5)
                points.append((x, y))
            
            page.mouse.move(*points[0])
            page.mouse.down()
            for point in points[1:]:
                page.mouse.move(*point)
                page.wait_for_timeout(10)
            page.mouse.up()
        
        # 模拟悬停菜单
        page.hover("nav .menu-item")
        page.wait_for_timeout(100)  # 等待菜单动画
        page.click("nav .menu-item .dropdown >> text=Settings")
        
        browser.close()
```

### 触控操作（移动端）

```python
def touch_operations():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 创建移动端上下文
        context = browser.new_context(**p.devices["iPhone 13"])
        page = context.new_page()
        
        page.goto("https://example.com")
        
        # 点击
        page.tap("#button")
        
        # 双击
        page.tap("#button", delay=100)
        
        # 长按
        page.tap("#button", delay=1000)
        
        # 滑动
        page.touchscreen.tap(200, 300)
        
        # 自定义手势
        page.evaluate("""() => {
            const el = document.elementFromPoint(200, 300);
            const pointerDown = new PointerEvent('pointerdown', {
                bubbles: true,
                clientX: 200,
                clientY: 300
            });
            const pointerUp = new PointerEvent('pointerup', {
                bubbles: true,
                clientX: 200,
                clientY: 300
            });
            el.dispatchEvent(pointerDown);
            setTimeout(() => el.dispatchEvent(pointerUp), 100);
        }""")
        
        context.close()
        browser.close()
```

## 表单验证和提示

### 自动等待验证

```python
def validation_examples():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 验证输入值
        page.fill("input[name='email']", "invalid-email")
        page.click("button[type='submit']")
        
        # 等待验证消息出现
        page.wait_for_selector(".error-message >> text=请输入有效的邮箱", state="visible")
        
        # 验证输入框状态
        input_field = page.locator("input[name='email']")
        is_invalid = input_field.evaluate("el => el.validity.valid")
        
        # 验证表单提交成功
        page.fill("input[name='email']", "valid@example.com")
        page.click("button[type='submit']")
        page.wait_for_selector(".success-message", state="visible")
        
        browser.close()
```

### 处理实时验证

```python
def realtime_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/form")
        
        # 监听输入事件
        page.locator("input[name='username']").on("input", lambda: print("输入中..."))
        
        # 等待验证状态变化
        input_field = page.locator("input[name='username']")
        
        # 输入时实时验证
        page.fill("input[name='username']", "ab")
        
        # 等待错误提示
        page.wait_for_selector(".validation-error >> text=用户名至少3个字符")
        
        # 清空并重新输入
        page.fill("input[name='username']", "")
        page.fill("input[name='username']", "validuser")
        
        # 等待错误消失
        page.wait_for_selector(".validation-error", state="hidden")
        
        browser.close()
```

## 错误处理

### 交互失败处理

```python
def interaction_error_handling():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        try:
            # 尝试点击
            page.click("#maybe-exists")
            
        except page.locator("#maybe-exists").ElementNotFoundError:
            print("元素不存在，跳过")
            
        except Exception as e:
            print(f"发生错误: {e}")
        
        # 安全点击（检查存在性）
        if page.locator("#optional-btn").count() > 0:
            page.locator("#optional-btn").click()
        
        # 使用 force 跳过检查
        page.click("#maybe-hidden", force=True)
        
        # 重试机制
        for attempt in range(3):
            try:
                page.click("#dynamic-btn", timeout=2000)
                break
            except TimeoutError:
                print(f"尝试 {attempt + 1} 失败，重试...")
                page.wait_for_timeout(500)
        
        browser.close()
```

## 性能优化

### 批量操作

```python
def batch_operations():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/list")
        
        # 批量勾选
        checkboxes = page.locator("input[type='checkbox']")
        for i in range(checkboxes.count()):
            if i % 2 == 0:  # 勾选偶数项
                checkboxes.nth(i).check()
        
        # 批量填写
        inputs = page.locator("input.information")
        inputs.nth(0).fill("Name")
        inputs.nth(1).fill("Email")
        inputs.nth(2).fill("Phone")
        
        # 使用 JavaScript 批量操作
        page.evaluate("""() => {
            const inputs = document.querySelectorAll('input');
            inputs.forEach((input, i) => {
                input.value = `Value ${i}`;
            });
        }""")
        
        browser.close()
```

### 避免不必要的等待

```python
def optimize_waiting():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # ❌ 不好：每次都等待
        page.wait_for_timeout(1000)
        page.click("#btn1")
        page.wait_for_timeout(1000)
        page.click("#btn2")
        
        # ✅ 好：使用智能等待
        page.click("#btn1")
        page.wait_for_selector("#btn2", state="visible")
        page.click("#btn2")
        
        # ✅ 好：并行操作（如果可能）
        # 而不是串行
        
        browser.close()
```

## 实战案例

### 完整的注册流程

```python
def complete_registration():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        try:
            # 1. 访问注册页面
            page.goto("https://example.com/register")
            page.wait_for_load_state("domcontentloaded")
            
            # 2. 填写基本信息
            page.fill("input[name='username']", "testuser123")
            page.fill("input[name='email']", "test@example.com")
            page.fill("input[name='password']", "SecurePass123!")
            page.fill("input[name='confirm_password']", "SecurePass123!")
            
            # 3. 填写个人信息
            page.fill("input[name='full_name']", "张三")
            page.fill("input[name='phone']", "13800138000")
            page.fill("input[type='date']", "1990-01-01")
            
            # 4. 选择选项
            page.check("input[value='male']")
            page.select_option("select[name='country']", "China")
            page.select_option("select[name='city']", "Beijing")
            
            # 5. 同意条款
            page.check("#agree-terms")
            page.check("#agree-privacy")
            
            # 6. 提交前验证
            assert page.locator("input[name='username']").input_value() == "testuser123"
            
            # 7. 提交表单
            page.click("button[type='submit']")
            
            # 8. 等待结果
            page.wait_for_url("**/welcome", timeout=5000)
            
            # 9. 验证成功
            assert page.locator(".success-message").is_visible()
            assert "注册成功" in page.locator(".success-message").inner_text()
            
            print("✅ 注册流程完成")
            
        except Exception as e:
            print(f"❌ 注册失败: {e}")
            page.screenshot(path="registration_error.png")
            
        finally:
            browser.close()
```
