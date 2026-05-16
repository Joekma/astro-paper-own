---
title: Selenium 高级技巧：JavaScript 执行
series: selenium
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: selenium-javascript-execution
description: '详细介绍Selenium中JavaScript执行的高级技巧，包括DOM操作、性能优化、自定义滚动等。'
tags:
  - Selenium
  - RPA
  - JavaScript
  - 高级技巧
draft: false
language: zh-CN
---

## 概述

JavaScript 执行是 Selenium 中最强大的功能之一。通过 `execute_script` 和 `execute_async_script` 方法，我们可以直接与页面 DOM 交互，执行复杂操作，实现 Selenium API 无法完成的任务。

### JavaScript 执行能力

```text
┌─────────────────────────────────────────────────────────────┐
│                  JavaScript 执行能力                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   DOM 操作       │  │   页面控制      │                  │
│  │                 │  │                 │                  │
│  │  • 创建元素     │  │  • 滚动控制     │                  │
│  │  • 修改属性     │  │  • 弹窗控制     │                  │
│  │  • 动画触发     │  │  • 焦点管理     │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   数据获取      │  │   性能优化      │                  │
│  │                 │  │                 │                  │
│  │  • 页面状态     │  │  • 懒加载       │                  │
│  │  • 窗口信息     │  │  • 批量操作     │                  │
│  │  • 元素信息     │  │  • 缓存控制     │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 基本用法

### execute_script

```python
from selenium import webdriver

driver = webdriver.Chrome()
driver.get("https://example.com")

# 执行简单的 JavaScript
title = driver.execute_script("return document.title;")
print(f"页面标题: {title}")

# 获取多个返回值
result = driver.execute_script("""
    return {
        title: document.title,
        url: window.location.href,
        readyState: document.readyState
    };
""")
print(result)
```

### execute_async_script

```python
# 异步执行 JavaScript
driver.execute_async_script("""
    // 模拟异步操作
    setTimeout(function() {
        arguments[0](document.title);
    }, 1000);
""", "callback argument")
```

## DOM 操作

### 创建元素

```python
# 创建新元素
driver.execute_script("""
    var newDiv = document.createElement('div');
    newDiv.id = 'my-div';
    newDiv.innerHTML = 'Hello World!';
    newDiv.style.cssText = 'color: red; font-size: 20px;';
    document.body.appendChild(newDiv);
""")
```

### 修改元素

```python
# 修改元素属性
driver.execute_script("""
    var element = document.getElementById('myElement');
    element.setAttribute('data-custom', 'custom-value');
    element.classList.add('active');
    element.style.display = 'none';
""")

# 修改文本内容
driver.execute_script("""
    arguments[0].textContent = 'New Text';
""", element)
```

### 删除元素

```python
# 删除元素
driver.execute_script("""
    var element = document.getElementById('toRemove');
    element.remove();
""")

# 清空容器
driver.execute_script("""
    document.getElementById('container').innerHTML = '';
""")
```

## 滚动控制

### 滚动到位置

```python
# 滚动到顶部
driver.execute_script("window.scrollTo(0, 0);")

# 滚动到底部
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")

# 滚动到指定位置
driver.execute_script("window.scrollTo(0, 500);")

# 滚动到元素
driver.execute_script("""
    arguments[0].scrollIntoView();
""", element)

# 平滑滚动到元素
driver.execute_script("""
    arguments[0].scrollIntoView({behavior: 'smooth'});
""", element)
```

### 滚动距离

```python
# 向下滚动 500px
driver.execute_script("window.scrollBy(0, 500);")

# 向上滚动 200px
driver.execute_script("window.scrollBy(0, -200);")

# 水平滚动
driver.execute_script("window.scrollBy(500, 0);")
```

### 滚动到元素中心

```python
driver.execute_script("""
    var element = arguments[0];
    var elementRect = element.getBoundingClientRect();
    var absoluteElementTop = elementRect.top + window.pageYOffset;
    var middle = absoluteElementTop - (window.innerHeight / 2);
    window.scrollTo(0, middle);
""", element)
```

## 页面信息获取

### 获取页面数据

```python
# 获取页面标题
title = driver.execute_script("return document.title;")

# 获取 URL
url = driver.execute_script("return window.location.href;")

# 获取域名
domain = driver.execute_script("return window.location.hostname;")

# 获取文档就绪状态
ready_state = driver.execute_script("return document.readyState;")

# 获取视口大小
viewport_size = driver.execute_script("""
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
""")

# 获取滚动位置
scroll_position = driver.execute_script("""
    return {
        x: window.pageXOffset,
        y: window.pageYOffset
    };
""")
```

### 获取元素信息

```python
# 获取元素位置和大小
element_info = driver.execute_script("""
    var element = arguments[0];
    var rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
    };
""", element)

# 获取元素在视口中的位置
is_in_viewport = driver.execute_script("""
    var element = arguments[0];
    var rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
""", element)
```

## 动态内容处理

### 懒加载图片

```python
def lazy_load_all_images(driver):
    """触发所有懒加载图片"""
    driver.execute_script("""
        var images = document.querySelectorAll('img[data-src]');
        images.forEach(function(img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    """)
```

### 无限滚动

```python
def infinite_scroll(driver, max_scrolls=10, delay=2):
    """无限滚动"""
    import time
    
    last_height = 0
    
    for _ in range(max_scrolls):
        # 滚动到底部
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        time.sleep(delay)
        
        # 检查高度变化
        new_height = driver.execute_script("return document.body.scrollHeight;")
        
        if new_height == last_height:
            # 没有新内容加载
            break
        
        last_height = new_height
```

### 等待动态加载

```python
def wait_for_dynamic_content(driver, selector, timeout=10):
    """等待动态内容加载"""
    import time
    start = time.time()
    
    while time.time() - start < timeout:
        # 检查元素是否存在
        exists = driver.execute_script("""
            return document.querySelector(arguments[0]) !== null;
        """, selector)
        
        if exists:
            # 检查元素是否可见
            is_visible = driver.execute_script("""
                var el = document.querySelector(arguments[0]);
                return el && el.offsetHeight > 0 && el.offsetWidth > 0;
            """, selector)
            
            if is_visible:
                return True
        
        time.sleep(0.5)
    
    return False
```

## 性能优化

### 禁用资源加载

```python
# 禁用图片加载
driver.execute_script("""
    var body = document.body;
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeName === 'IMG') {
                    node.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                }
            });
        });
    });
    observer.observe(body, { childList: true, subtree: true });
""")

# 禁用 CSS 加载
driver.execute_script("""
    var links = document.getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        if (links[i].rel === 'stylesheet') {
            links[i].disabled = true;
        }
    }
""")
```

### 加快页面加载

```python
# 阻止不必要的请求
driver.execute_script("""
    var blockedTypes = ['image', 'stylesheet', 'font'];
    var originalFetch = window.fetch;
    
    // 拦截请求（根据需要调整）
    // 注意：这会影响实际功能，使用时需谨慎
""")
```

### 批量 DOM 操作

```python
# 批量添加元素
driver.execute_script("""
    var container = document.getElementById('container');
    var fragment = document.createDocumentFragment();
    
    for (var i = 0; i < 1000; i++) {
        var div = document.createElement('div');
        div.textContent = 'Item ' + i;
        fragment.appendChild(div);
    }
    
    container.appendChild(fragment);
""")
```

## 动画和交互

### 触发动画

```python
# 触发动画
driver.execute_script("""
    var element = arguments[0];
    element.classList.add('animate');
""", element)

# 等待动画完成
driver.execute_script("""
    var element = arguments[0];
    var computed = window.getComputedStyle(element);
    var animationDuration = parseFloat(computed.animationDuration) * 1000;
    setTimeout(arguments[1], animationDuration);
""", element, callback)
```

### 模拟拖拽

```python
def javascript_drag_drop(driver, source, target):
    """使用 JavaScript 模拟拖拽"""
    driver.execute_script("""
        var source = arguments[0];
        var target = arguments[1];
        
        var dataTransfer = {
            dropEffect: 'move',
            files: [],
            items: {},
            types: []
        };
        
        var dragStartEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        source.dispatchEvent(dragStartEvent);
        
        var dragEnterEvent = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dragEnterEvent);
        
        var dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dragOverEvent);
        
        var dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        target.dispatchEvent(dropEvent);
        
        var dragEndEvent = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
        source.dispatchEvent(dragEndEvent);
    """, source, target)
```

## 复杂操作示例

### 模拟粘贴

```python
def paste_from_clipboard(driver, element, text):
    """模拟粘贴操作"""
    driver.execute_script("""
        var element = arguments[0];
        var text = arguments[1];
        
        // 使用 Clipboard API
        navigator.clipboard.writeText(text).then(function() {
            element.focus();
            
            var pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: {
                    getData: function() { return text; }
                }
            });
            element.dispatchEvent(pasteEvent);
        });
    """, element, text)
```

### 高亮元素

```python
def highlight_element(driver, element):
    """高亮显示元素"""
    driver.execute_script("""
        var element = arguments[0];
        var originalOutline = element.style.outline;
        var originalBackground = element.style.backgroundColor;
        
        element.style.outline = '3px solid red';
        element.style.backgroundColor = 'yellow';
        
        setTimeout(function() {
            element.style.outline = originalOutline;
            element.style.backgroundColor = originalBackground;
        }, 2000);
    """, element)
```

### 全选和清空

```python
# 全选输入框内容
driver.execute_script("""
    arguments[0].select();
    arguments[0].setSelectionRange(0, arguments[0].value.length);
""", input_element)

# 清空输入框
driver.execute_script("""
    var input = arguments[0];
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, '');
    var inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);
""", input_element)
```

## 常见问题解决

### 问题 1：隐藏元素操作

```python
# 移除隐藏属性
driver.execute_script("""
    var element = arguments[0];
    element.style.display = 'block';
""", element)

# 然后操作
element.click()
```

### 问题 2：日期选择器

```python
# 直接设置日期输入框的值
driver.execute_script("""
    var input = arguments[0];
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, '2024-12-25');
    var inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);
    var changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);
""", date_input)
```

### 问题 3：上传隐藏 input

```python
# 显示隐藏的上传 input
driver.execute_script("""
    var input = arguments[0];
    input.style.display = 'block';
    input.style.visibility = 'visible';
    input.style.opacity = '1';
    input.style.position = 'fixed';
""", file_input)

# 上传文件
file_input.send_keys("/path/to/file.png")
```
