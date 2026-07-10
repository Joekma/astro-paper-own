---
title: Selenium 截图与文件操作
series: selenium
seriesOrder: 9
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: selenium-screenshots-files
description: '详细介绍Selenium的截图功能、文件下载上传操作，以及如何处理各种文件交互场景。'
tags:
  - Selenium
  - RPA
  - 截图
  - 文件操作
draft: false
language: zh-CN
---

## 概述

截图和文件操作是 Selenium 自动化中的重要功能。截图可用于调试和报告，文件操作则涵盖下载、上传和处理各种文件类型。

![Selenium 截图下载上传文件通道图](./images/selenium-screenshot-file-operations-figure-01.png)

### 功能概览

```text
┌─────────────────────────────────────────────────────────────┐
│                    截图与文件操作                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    截图      │    │   文件下载   │    │   文件上传   │  │
│  │              │    │              │    │              │  │
│  │ • 全页面     │    │ • 自动下载   │    │ • input 上传 │  │
│  │ • 视口截图   │    │ • 下载对话   │    │ • 拖拽上传   │  │
│  │ • 元素截图   │    │ • 路径保存   │    │ • 进度跟踪   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 截图功能

### 基本截图

```python
from selenium import webdriver
from datetime import datetime
import os

driver = webdriver.Chrome()
driver.get("https://example.com")

# 保存截图
driver.save_screenshot("screenshot.png")

# 获取截图为 PNG 字节
screenshot_bytes = driver.get_screenshot_as_png()

# 获取截图为 Base64
screenshot_base64 = driver.get_screenshot_as_base64()
```

### 带时间戳的截图

```python
def take_screenshot(driver, name="screenshot"):
    """生成带时间戳的截图"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{name}_{timestamp}.png"
    driver.save_screenshot(filename)
    print(f"截图已保存: {filename}")
    return filename

def take_error_screenshot(driver, test_name):
    """失败时自动截图"""
    screenshot_dir = "screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{screenshot_dir}/{test_name}_{timestamp}.png"
    driver.save_screenshot(filename)
    return filename
```

### 元素截图

```python
# 截取特定元素
element = driver.find_element(By.ID, "chart-container")

# 获取元素位置和大小
location = element.location
size = element.size

# 截图并裁剪
screenshot = driver.save_screenshot("full_page.png")

# 使用 PIL 裁剪元素区域
from PIL import Image

img = Image.open("full_page.png")
x = location['x']
y = location['y']
w = size['width']
h = size['height']

cropped = img.crop((x, y, x + w, y + h))
cropped.save("element.png")
```

### 全页面截图

```python
def take_full_page_screenshot(driver, filename="full_page.png"):
    """截取整个页面"""
    # 某些浏览器支持全页面截图
    total_width = driver.execute_script("return document.body.scrollWidth")
    total_height = driver.execute_script("return document.body.scrollHeight")
    
    driver.set_window_size(total_width, total_height)
    driver.save_screenshot(filename)
    
    # 恢复原始大小
    driver.set_window_size(1920, 1080)
    
    return filename
```

## 文件下载

### 自动下载

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
# 设置下载路径
prefs = {"download.default_directory": "/path/to/downloads"}
options.add_experimental_option("prefs", prefs)

driver = webdriver.Chrome(options=options)
driver.get("https://example.com/downloads")

# 点击下载链接
driver.find_element(By.ID, "download-btn").click()

# 等待下载完成
import time
time.sleep(3)

# 验证文件已下载
import os
download_path = "/path/to/downloads"
files = os.listdir(download_path)
print(f"已下载文件: {files}")
```

### 下载进度跟踪

```python
import os
import time
from pathlib import Path

def download_file_with_progress(driver, selector, expected_filename):
    """下载文件并跟踪进度"""
    download_dir = Path("downloads")
    download_dir.mkdir(exist_ok=True)
    
    # 获取下载前文件列表
    before_files = set(download_dir.glob("*"))
    
    # 点击下载
    driver.find_element(By.CSS_SELECTOR, selector).click()
    
    # 轮询等待新文件出现
    max_wait = 30
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        after_files = set(download_dir.glob("*"))
        new_files = after_files - before_files
        
        for file in new_files:
            # 检查文件是否下载完成（大小不再变化）
            if is_download_complete(file):
                print(f"下载完成: {file.name}")
                return file
        
        time.sleep(0.5)
    
    raise Exception("下载超时")

def is_download_complete(file_path):
    """检查文件是否下载完成"""
    if not file_path.exists():
        return False
    
    initial_size = -1
    current_size = file_path.stat().st_size
    
    time.sleep(1)
    new_size = file_path.stat().st_size
    
    # 如果文件大小不再变化，认为下载完成
    return current_size == new_size and current_size > 0
```

### 处理下载对话框

```python
# 禁用下载对话框并直接保存
options = Options()
prefs = {
    "download.prompt_for_download": False,
    "download.default_directory": "/path/to/downloads",
    "download.directory_upgrade": True,
    "safebrowsing.enabled": True
}
options.add_experimental_option("prefs", prefs)

# 设置无头模式（某些浏览器）
options.add_argument("--headless")
```

## 文件上传

### 基本上传

```python
def upload_file(file_path):
    driver.get("https://example.com/upload")
    
    # 找到文件上传 input
    upload_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
    
    # 上传文件
    upload_input.send_keys(file_path)
    
    # 验证文件名显示
    filename_display = driver.find_element(By.CLASS_NAME, "filename")
    assert file_path.split("/")[-1] in filename_display.text
    
    # 点击上传按钮
    driver.find_element(By.ID, "upload-btn").click()
    
    # 等待上传完成
    wait = WebDriverWait(driver, 10)
    wait.until(
        EC.text_to_be_present_in_element(
            (By.CLASS_NAME, "upload-status"), 
            "上传成功"
        )
    )
```

### 多文件上传

```python
def upload_multiple_files(file_paths):
    driver.get("https://example.com/upload")
    
    # 多文件上传
    upload_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
    
    # 多个文件路径用换行符分隔
    file_paths_str = "\n".join(file_paths)
    upload_input.send_keys(file_paths_str)
    
    # 上传
    driver.find_element(By.ID, "upload-btn").click()
    
    # 验证所有文件
    for file_path in file_paths:
        filename = file_path.split("/")[-1]
        assert driver.find_element(By.XPATH, f"//*[contains(text(), '{filename}')]")
```

### 拖放上传

```python
from selenium.webdriver import ActionChains

def drag_and_drop_upload(driver, file_path):
    """拖放文件上传"""
    driver.get("https://example.com/upload")
    
    # 找到拖放区域
    drop_zone = driver.find_element(By.CLASS_NAME, "drop-zone")
    
    # 如果需要隐藏的 input
    file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
    
    # 方法 1：使用 JavaScript 设置值
    driver.execute_script(
        "arguments[0].style.display = 'block';",
        file_input
    )
    file_input.send_keys(file_path)
    
    # 方法 2：模拟拖放
    ActionChains(driver) \
        .drag_and_drop(file_path, drop_zone) \
        .perform()
```

## 文件操作工具

### 文件管理类

```python
import os
import shutil
from pathlib import Path
from datetime import datetime

class FileManager:
    """文件管理工具"""
    
    def __init__(self, base_dir="downloads"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
    
    def save_screenshot(self, driver, name="screenshot"):
        """保存截图"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = self.base_dir / f"{name}_{timestamp}.png"
        driver.save_screenshot(str(filename))
        return filename
    
    def get_downloaded_files(self, pattern="*"):
        """获取下载的文件"""
        return list(self.base_dir.glob(pattern))
    
    def cleanup_old_files(self, days=7):
        """清理旧文件"""
        cutoff = datetime.now().timestamp() - days * 24 * 3600
        
        for file in self.base_dir.glob("*"):
            if file.stat().st_mtime < cutoff:
                file.unlink()
                print(f"已删除: {file}")
    
    def read_file_content(self, filename):
        """读取文件内容"""
        file_path = self.base_dir / filename
        if file_path.suffix == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        elif file_path.suffix == '.json':
            import json
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
```

## 实际应用

### 自动化报告生成

```python
def generate_test_report(driver, test_name):
    """生成测试报告截图"""
    driver.get("https://example.com/dashboard")
    
    # 等待内容加载
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "report-content")))
    
    # 截图保存
    screenshot_dir = Path("reports/screenshots")
    screenshot_dir.mkdir(exist_ok=True)
    
    filename = screenshot_dir / f"{test_name}.png"
    driver.save_screenshot(str(filename))
    
    return filename
```

### 自动化数据导出

```python
def export_data(driver, format="csv"):
    """导出数据"""
    driver.get("https://example.com/data")
    
    # 点击导出按钮
    driver.find_element(By.ID, "export-btn").click()
    
    # 选择格式
    if format == "csv":
        driver.find_element(By.CSS_SELECTOR, "input[value='csv']").click()
    elif format == "excel":
        driver.find_element(By.CSS_SELECTOR, "input[value='excel']").click()
    
    # 确认导出
    driver.find_element(By.ID, "confirm-export").click()
    
    # 等待下载
    time.sleep(5)
    
    # 查找下载的文件
    download_dir = Path.home() / "Downloads"
    files = list(download_dir.glob(f"*.{format}"))
    
    return files[-1] if files else None
```

### 批量文件上传

```python
from pathlib import Path

def batch_upload(driver, directory):
    """批量上传文件"""
    driver.get("https://example.com/upload")
    
    # 获取目录下所有文件
    files = list(Path(directory).glob("*.*"))
    
    if not files:
        print(f"目录 {directory} 中没有文件")
        return
    
    # 逐个上传
    successful = 0
    failed = []
    
    for file_path in files:
        try:
            upload_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
            upload_input.send_keys(str(file_path))
            
            # 等待上传
            wait = WebDriverWait(driver, 10)
            status = wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "upload-status"))
            )
            
            if "成功" in status.text:
                successful += 1
                print(f"✓ {file_path.name} 上传成功")
            else:
                failed.append(file_path.name)
                print(f"✗ {file_path.name} 上传失败")
            
            # 清除上传框，准备下一个文件
            upload_input.clear()
            
        except Exception as e:
            failed.append(file_path.name)
            print(f"✗ {file_path.name} 上传失败: {e}")
    
    return {"successful": successful, "failed": failed}
```

## 最佳实践

### 截图最佳实践

```python
# ✅ 在关键步骤截图
def test_with_screenshots(browser):
    browser.get("https://example.com/form")
    browser.save_screenshot("step1_form.png")  # 步骤1截图
    
    browser.find_element(By.NAME, "username").send_keys("test")
    browser.save_screenshot("step2_filled.png")  # 步骤2截图
    
    # 验证
    browser.find_element(By.ID, "submit").click()
    browser.save_screenshot("step3_submitted.png")  # 步骤3截图

# ✅ 失败时自动截图
@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item):
    outcome = yield
    if outcome.get_result().when == "call":
        if outcome.get_result().failed:
            driver = item.funcargs.get("browser")
            if driver:
                driver.save_screenshot(f"failure_{item.name}.png")
```

### 文件操作最佳实践

```python
# ✅ 使用上下文管理器
def process_downloaded_file(driver):
    download_dir = Path("downloads")
    download_dir.mkdir(exist_ok=True)
    
    driver.get("https://example.com/download")
    driver.find_element(By.ID, "download-btn").click()
    
    # 等待下载完成
    time.sleep(5)
    
    # 处理文件
    files = list(download_dir.glob("*.csv"))
    if files:
        file = files[0]
        content = file.read_text()
        
        # 处理完成后可选择删除
        file.unlink()

# ✅ 验证文件存在后再操作
def safe_file_operation(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"文件不存在: {filepath}")
    
    with open(filepath, 'r') as f:
        return f.read()
```
