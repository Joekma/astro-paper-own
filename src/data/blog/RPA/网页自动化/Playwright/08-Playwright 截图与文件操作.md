---
title: Playwright 截图与文件操作
series: playwright
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-screenshots-files
description: '详细介绍Playwright的截图功能、PDF生成、文件下载上传等操作，以及如何处理各种文件交互场景。'
tags:
  - Playwright
  - RPA
  - 截图
  - 文件操作
draft: false
language: zh-CN
---

## 概述

在网页自动化中，截图和文件操作是两个非常实用的功能。截图可以用于调试、报告生成和视觉测试，而文件操作则涵盖了下载、上传和处理各种文件类型。本教程将详细介绍这些功能的使用方法和最佳实践。

### 功能概览

```
┌─────────────────────────────────────────────────────────────┐
│                   截图与文件操作                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    截图      │    │   PDF 生成   │    │   文件下载   │  │
│  │              │    │              │    │              │  │
│  │ • 全页面     │    │ • 标准 PDF   │    │ • 自动下载   │  │
│  │ • 视口截图   │    │ • 自定义     │    │ • 手动保存   │  │
│  │ • 元素截图   │    │   格式       │    │ • 路径指定   │  │
│  │ • 动画截图   │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   文件上传    │    │  文件下载    │                      │
│  │              │    │              │                      │
│  │ • 单文件     │    │ • 图片       │                      │
│  │ • 多文件     │    │ • 文档       │                      │
│  │ • 拖拽上传   │    │ • 压缩包     │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 截图功能

### 基本截图

```python
from playwright.sync_api import sync_playwright

def basic_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 视口截图（当前可见区域）
        page.screenshot(path="viewport.png")
        
        # 指定路径和格式
        page.screenshot(path="screenshot.jpg", type="jpeg", quality=80)
        
        # PNG 格式（默认）
        page.screenshot(path="screenshot.png")
        
        browser.close()
```

### 全页面截图

```python
def full_page_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/long-page")
        
        # 整个页面的截图，包括滚动区域
        page.screenshot(path="full-page.png", full_page=True)
        
        # 等待页面完全加载
        page.wait_for_load_state("networkidle")
        page.screenshot(path="full-page-complete.png", full_page=True)
        
        browser.close()
```

### 元素截图

```python
def element_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 截取特定元素
        element = page.locator(".widget.chart")
        element.screenshot(path="chart-widget.png")
        
        # 使用选择器
        page.locator("#header").screenshot(path="header.png")
        
        # 截取多个元素
        products = page.locator(".product-card")
        for i in range(products.count()):
            products.nth(i).screenshot(f"product-{i}.png")
        
        browser.close()
```

### 高级截图选项

```python
def advanced_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 隐藏特定元素
        page.screenshot(
            path="clean-screenshot.png",
            mask=[page.locator(".ads"), page.locator(".sidebar")]
        )
        
        # 添加额外样式
        page.screenshot(
            path="styled-screenshot.png",
            style={
                "background": "#000",
                "full_page": "true"
            }
        )
        
        # 带动画帧截图
        for i in range(10):
            page.screenshot(path=f"animation-frame-{i}.png")
        
        browser.close()
```

### 截图格式对比

| 格式 | 优点 | 适用场景 |
|------|------|----------|
| PNG | 无损压缩，支持透明 | 截图、图表、UI |
| JPEG | 文件小，适合照片 | 照片、复杂图像 |
| WebP | 压缩率高，支持动画 | 现代浏览器 |
| GIF | 支持动画 | 动画演示 |

```python
def screenshot_formats():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # PNG（默认）
        page.screenshot(path="screenshot.png", type="png")
        
        # JPEG
        page.screenshot(path="screenshot.jpg", type="jpeg", quality=85)
        
        # 带透明度（PNG）
        page.screenshot(path="screenshot-bg-removed.png", omit_background=True)
        
        browser.close()
```

## PDF 生成

### 基本 PDF

```python
def basic_pdf():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 生成标准 PDF
        page.pdf(path="page.pdf")
        
        browser.close()
```

### PDF 选项

```python
def pdf_options():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 自定义 PDF 选项
        page.pdf(
            path="custom.pdf",
            format="A4",           # 纸张大小
            landscape=True,        # 横向
            margin={
                "top": "20mm",
                "right": "20mm",
                "bottom": "20mm",
                "left": "20mm"
            },
            scale=1.0,             # 缩放
            display_header_footer=True,  # 显示页眉页脚
            header_template="<div style='font-size:12px;text-align:center;'>Header</div>",
            footer_template="<div style='font-size:12px;text-align:center;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>",
            print_background=True,      # 打印背景色
            page_ranges="1-5"      # 打印页码范围
        )
        
        browser.close()
```

### 常用纸张格式

| 格式 | 尺寸（英寸） | 尺寸（mm） |
|------|-------------|-----------|
| Letter | 8.5 × 11 | 215.9 × 279.4 |
| Legal | 8.5 × 14 | 215.9 × 355.6 |
| A4 | 8.27 × 11.69 | 210 × 297 |
| A3 | 11.69 × 16.54 | 297 × 420 |
| Tabloid | 11 × 17 | 279.4 × 431.8 |

## 文件下载

### 基本下载

```python
def basic_download():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/downloads")
        
        # 等待下载完成
        with page.expect_download() as download_info:
            page.click("a.download-btn")
        
        download = download_info.value
        
        # 保存到指定路径
        download.save_as("path/to/saved-file.pdf")
        
        # 获取下载文件路径
        path = download.path()
        print(f"文件下载到: {path}")
        
        # 获取建议的文件名
        suggested_filename = download.suggested_filename
        print(f"建议文件名: {suggested_filename}")
        
        browser.close()
```

### 下载事件监听

```python
def download_listeners():
    from playwright.sync_api import Page, Download
        
    def handle_download(download: Download):
        print(f"开始下载: {download.url}")
        print(f"建议文件名: {download.suggested_filename}")
        
        # 保存文件
        path = download.save_as(f"downloads/{download.suggested_filename}")
        print(f"保存路径: {path}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # 注册下载监听器
        page.on("download", handle_download)
        
        page.goto("https://example.com/downloads")
        page.click("a.download-btn")
        
        # 等待下载完成
        page.wait_for_timeout(5000)
        
        browser.close()
```

### 下载进度跟踪

```python
def download_with_progress():
    import os
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/downloads")
        
        with page.expect_download() as download_info:
            page.click("a.large-file")
        
        download = download_info.value
        total_size = download.total_size
        
        # 保存并跟踪进度
        save_path = f"downloads/{download.suggested_filename}"
        
        # 分块读取（如果需要）
        if total_size:
            print(f"文件大小: {total_size / (1024*1024):.2f} MB")
        
        # 保存文件
        final_path = download.save_as(save_path)
        print(f"下载完成: {final_path}")
        
        browser.close()
```

### 拦截下载响应

```python
def intercept_download():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/downloads")
        
        # 拦截下载请求
        def handle_route(route):
            response = route.fetch()
            # 可以修改响应
            route.fulfill(response=response)
        
        page.context.route("**/*.pdf", handle_route)
        
        page.click("a.download-btn")
        page.wait_for_timeout(2000)
        
        browser.close()
```

## 文件上传

### 基本上传

```python
def basic_upload():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        # 单文件上传
        page.set_input_files("input[type='file']", "path/to/file.pdf")
        
        # 多文件上传
        page.set_input_files(
            "input[type='file']",
            [
                "path/to/file1.pdf",
                "path/to/file2.pdf",
                "path/to/file3.pdf"
            ]
        )
        
        browser.close()
```

### 上传选项

```python
def upload_options():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        # 清空已选择的文件
        page.set_input_files("input[type='file']", [])
        
        # 使用选择器定位上传框
        page.set_input_files(
            "#file-upload",
            "path/to/document.pdf"
        )
        
        # 使用 locator
        page.locator("input[type='file']").set_input_files("file.pdf")
        
        # 等待上传完成
        page.wait_for_selector(".upload-success", state="visible")
        
        browser.close()
```

### 拖拽上传

```python
def drag_upload():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        # 拖拽文件到上传区域
        page.locator(".dropzone").set_input_files("path/to/file.pdf")
        
        # 或者使用拖拽操作
        with page.locator(".dropzone").drag_over():
            page.locator(".dropzone").set_input_files("file.pdf")
        
        browser.close()
```

### 上传进度

```python
def upload_with_progress():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        # 上传大文件
        page.set_input_files("input[type='file']", "path/to/large-file.zip")
        
        # 等待上传进度显示
        page.wait_for_selector(".upload-progress")
        
        # 监控进度
        while True:
            progress_text = page.locator(".upload-progress").inner_text()
            if "100%" in progress_text or "完成" in progress_text:
                break
            page.wait_for_timeout(500)
        
        # 等待上传完成消息
        page.wait_for_selector(".upload-success", timeout=60000)
        
        browser.close()
```

## 文件处理实战

### 处理不同类型文件

```python
import os
from pathlib import Path

def handle_various_files():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/files")
        
        # 定义要处理的目录
        download_dir = Path("downloads")
        download_dir.mkdir(exist_ok=True)
        
        # 处理图片
        with page.expect_download() as download_info:
            page.click("a[download*='.jpg']")
        download = download_info.value
        img_path = download.save_as(download_dir / download.suggested_filename)
        print(f"图片下载: {img_path}")
        
        # 处理 PDF
        with page.expect_download() as download_info:
            page.click("a[download*='.pdf']")
        download = download_info.value
        pdf_path = download.save_as(download_dir / download.suggested_filename)
        print(f"PDF下载: {pdf_path}")
        
        # 处理压缩包
        with page.expect_download() as download_info:
            page.click("a[download*='.zip']")
        download = download_info.value
        zip_path = download.save_as(download_dir / download.suggested_filename)
        print(f"压缩包下载: {zip_path}")
        
        browser.close()
```

### 批量下载

```python
def batch_download():
    from pathlib import Path
    import time
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/gallery")
        
        download_dir = Path("downloads")
        download_dir.mkdir(exist_ok=True)
        
        # 获取所有下载链接
        download_links = page.locator("a.download").all()
        print(f"发现 {len(download_links)} 个下载链接")
        
        # 批量下载
        for i, link in enumerate(download_links):
            try:
                with page.expect_download() as download_info:
                    link.click()
                
                download = download_info.value
                save_path = download_dir / f"file_{i}_{download.suggested_filename}"
                download.save_as(save_path)
                print(f"✓ 下载完成: {save_path}")
                
            except Exception as e:
                print(f"✗ 下载失败: {e}")
        
        browser.close()
```

### 上传自动化

```python
def automated_upload():
    from pathlib import Path
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        # 准备要上传的文件
        upload_dir = Path("uploads")
        files_to_upload = list(upload_dir.glob("*.pdf"))
        
        # 逐个上传
        for file_path in files_to_upload:
            print(f"上传文件: {file_path}")
            
            # 选择文件
            page.set_input_files("input[type='file']", str(file_path))
            
            # 填写描述
            page.fill("input[name='description']", f"上传文件: {file_path.name}")
            
            # 提交
            page.click("button[type='submit']")
            
            # 等待上传完成
            page.wait_for_selector(".upload-success", timeout=30000)
            print(f"✓ {file_path.name} 上传成功")
            
            # 清空上传框，准备下一个文件
            page.set_input_files("input[type='file']", [])
        
        browser.close()
```

## 文件路径处理

### 路径操作

```python
import os
from pathlib import Path

def path_handling():
    # 使用 pathlib（推荐）
    project_root = Path(__file__).parent
    download_dir = project_root / "downloads"
    screenshot_dir = project_root / "screenshots"
    
    # 创建目录
    download_dir.mkdir(exist_ok=True)
    screenshot_dir.mkdir(exist_ok=True)
    
    # 构建文件路径
    timestamp = "20240101_120000"
    screenshot_path = screenshot_dir / f"screenshot_{timestamp}.png"
    
    print(f"项目根目录: {project_root}")
    print(f"下载目录: {download_dir}")
    print(f"截图路径: {screenshot_path}")
    
    # 文件操作
    if screenshot_path.exists():
        print(f"文件大小: {screenshot_path.stat().st_size} bytes")
    
    # 清理旧文件
    for old_file in screenshot_dir.glob("*.png"):
        if old_file.stat().st_mtime < time.time() - 7 * 24 * 60 * 60:  # 7 天前
            old_file.unlink()
            print(f"删除旧文件: {old_file}")
```

### 动态文件名

```python
def dynamic_filenames():
    from datetime import datetime
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # 使用时间戳
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 截图
        page.screenshot(path=f"screenshots/screenshot_{timestamp}.png")
        
        # PDF
        page.pdf(path=f"documents/report_{timestamp}.pdf")
        
        # 使用正则从内容提取文件名
        title = page.title().replace("/", "-").replace("\\", "-")
        page.screenshot(path=f"screenshots/{title}_{timestamp}.png")
        
        browser.close()
```

## 错误处理

### 下载错误处理

```python
def download_error_handling():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/downloads")
        
        try:
            # 设置超时
            with page.expect_download(timeout=30000) as download_info:
                page.click("a.download-btn")
            
            download = download_info.value
            path = download.save_as(f"downloads/{download.suggested_filename}")
            print(f"下载成功: {path}")
            
        except TimeoutError:
            print("下载超时")
            
        except Exception as e:
            print(f"下载失败: {e}")
            
        finally:
            browser.close()
```

### 上传错误处理

```python
def upload_error_handling():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com/upload")
        
        try:
            # 检查文件是否存在
            file_path = "path/to/file.pdf"
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"文件不存在: {file_path}")
            
            # 检查文件大小
            file_size = os.path.getsize(file_path)
            max_size = 10 * 1024 * 1024  # 10MB
            if file_size > max_size:
                raise ValueError(f"文件过大: {file_size} bytes")
            
            # 上传
            page.set_input_files("input[type='file']", file_path)
            page.click("button[type='submit']")
            
            # 检查错误提示
            if page.locator(".upload-error").is_visible():
                error_msg = page.locator(".upload-error").inner_text()
                raise Exception(f"上传失败: {error_msg}")
            
            print("上传成功")
            
        except FileNotFoundError as e:
            print(f"文件错误: {e}")
            
        except ValueError as e:
            print(f"验证错误: {e}")
            
        except Exception as e:
            print(f"上传错误: {e}")
            
        finally:
            browser.close()
```

## 最佳实践

### 截图最佳实践

```python
def screenshot_best_practices():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto("https://example.com")
        
        # ✅ 在关键步骤截图
        page.screenshot(path="screenshots/step1_initial.png")
        
        page.fill("input[name='username']", "user")
        page.screenshot(path="screenshots/step2_filled.png")
        
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="screenshots/step3_result.png")
        
        # ✅ 在错误时截图
        try:
            expect(page.locator(".success")).to_be_visible()
        except AssertionError:
            page.screenshot(path="screenshots/error_state.png")
            raise
        
        # ✅ 全页面截图用于长页面
        page.goto("https://example.com/long-page")
        page.screenshot(path="screenshots/full_page.png", full_page=True)
        
        browser.close()
```

### 文件操作最佳实践

```python
def file_best_practices():
    from pathlib import Path
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # ✅ 使用上下文管理器处理文件
        download_dir = Path("downloads")
        download_dir.mkdir(exist_ok=True)
        
        page = browser.new_page()
        page.goto("https://example.com")
        
        # ✅ 验证下载前检查磁盘空间
        import shutil
        total, used, free = shutil.disk_usage("/")
        if free < 100 * 1024 * 1024:  # 小于 100MB
            raise Exception("磁盘空间不足")
        
        # ✅ 下载后验证文件
        with page.expect_download() as download_info:
            page.click("a.download")
        
        download = download_info.value
        path = download.save_as(download_dir / download.suggested_filename)
        
        # 验证文件
        if not Path(path).exists():
            raise Exception("文件下载失败")
        
        print(f"文件大小: {Path(path).stat().st_size} bytes")
        
        browser.close()
```
