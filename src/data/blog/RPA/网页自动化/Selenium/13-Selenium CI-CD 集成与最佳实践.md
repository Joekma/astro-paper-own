---
title: Selenium CI/CD 集成与最佳实践
series: selenium
seriesOrder: 13
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: selenium-ci-cd-integration
description: '详细介绍Selenium在CI/CD环境中的集成，包括GitHub Actions、GitLab CI配置，以及测试报告生成和最佳实践。'
tags:
  - Selenium
  - RPA
  - CI/CD
  - DevOps
draft: false
language: zh-CN
---

## 概述

将 Selenium 集成到 CI/CD 流程中可以实现自动化测试、持续监控和快速反馈。本教程将详细介绍如何在各种 CI/CD 平台上配置 Selenium。

### CI/CD 集成架构

```text
┌─────────────────────────────────────────────────────────────┐
│                   CI/CD 集成架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐                                               │
│  │   Git    │                                               │
│  │  Push    │                                               │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ CI Build │ ──▶ 语法检查 ──▶ 单元测试                      │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ Selenium │ ──▶ 测试 ──▶ 截图/报告                        │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ Deploy  │ ──▶ Staging ──▶ Production                     │
│  └──────────┘                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Docker 环境配置

### Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 运行测试
CMD ["pytest", "--html=reports/report.html", "--junitxml=reports/results.xml"]
```

### requirements.txt

```txt
selenium==4.15.0
webdriver-manager==4.0.1
pytest==7.4.3
pytest-html==4.1.1
pytest-xdist==3.5.0
allure-pytest==2.13.2
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  selenium-tests:
    build: .
    container_name: selenium-tests
    volumes:
      - ./tests:/app/tests
      - ./reports:/app/reports
    environment:
      - PYTHONPATH=/app
    shm_size: '2gb'
```

## GitHub Actions 集成

### 基础工作流

```yaml
# .github/workflows/selenium-tests.yml
name: Selenium Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Install Chrome
      run: |
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
        echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
        apt-get update
        apt-get install -y google-chrome-stable
    
    - name: Run Selenium tests
      run: |
        pytest tests/ \
          --html=reports/report.html \
          --junitxml=reports/results.xml \
          --tb=short
    
    - name: Upload HTML Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: reports/
        retention-days: 30
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: reports/results.xml
```

### 跨浏览器测试

```yaml
# .github/workflows/multi-browser-tests.yml
name: Multi-Browser Tests

on:
  schedule:
    - cron: '0 2 * * *'

jobs:
  chrome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-xdist
      - run: pytest tests/ --browser=chrome -n 4

  firefox:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-xdist
      - run: pytest tests/ --browser=firefox -n 4
```

### 并行测试

```yaml
# .github/workflows/parallel-tests.yml
name: Parallel Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/ --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-shard-${{ matrix.shard }}
          path: reports/
```

## GitLab CI 集成

### .gitlab-ci.yml

```yaml
# .gitlab-ci.yml
stages:
  - test
  - report

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip/
    - .venv/

before_script:
  - python --version
  - pip install -r requirements.txt
  - wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
  - echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
  - apt-get update && apt-get install -y google-chrome-stable

test:chrome:
  stage: test
  image: python:3.11-slim
  script:
    - pytest tests/ --browser=chrome --html=reports/report-chrome.html --junitxml=reports/results-chrome.xml
  artifacts:
    when: always
    paths:
      - reports/
    expire_in: 7 days

pages:
  stage: report
  image: alpine:latest
  script:
    - mv reports public/
  artifacts:
    paths:
      - public
    only:
      - main
```

## Jenkins 集成

### Jenkinsfile

```groovy
// Jenkinsfile
pipeline {
    agent {
        docker {
            image 'python:3.11-slim'
            args '-u root:root'
        }
    }
    
    environment {
        BROWSER = 'chrome'
        HEADLESS = 'true'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup') {
            steps {
                sh '''
                    pip install -r requirements.txt
                    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
                    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
                    apt-get update && apt-get install -y google-chrome-stable
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                    pytest tests/ \
                        --browser=$BROWSER \
                        --html=reports/report.html \
                        --junitxml=reports/results.xml
                '''
            }
        }
        
        stage('Report') {
            steps {
                junit 'reports/results.xml'
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: 'report.html',
                    reportName: 'Selenium Test Report'
                ])
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

## 测试配置

### pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

markers =
    smoke: marks tests as smoke tests
    integration: marks tests as integration tests
    slow: marks tests as slow

addopts = 
    -v
    --tb=short
    --strict-markers
    --html=reports/report.html
    --self-contained-html
    --junitxml=reports/results.xml

timeout = 300
timeout_method = thread
```

### conftest.py

```python
# tests/conftest.py
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="session")
def browser():
    """会话级浏览器"""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(10)
    
    yield driver
    
    driver.quit()

@pytest.fixture
def home_page(browser):
    """首页 fixture"""
    browser.get("https://example.com")
    return browser

@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
    """失败时截图"""
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call" and rep.failed:
        driver = item.funcargs.get("browser")
        if driver:
            import os
            from datetime import datetime
            os.makedirs("screenshots", exist_ok=True)
            filename = f"screenshots/{item.name}_{datetime.now().strftime('%H%M%S')}.png"
            driver.save_screenshot(filename)
```

## 测试报告

### Allure 报告

```bash
# 安装 allure-pytest
pip install allure-pytest allure-pytest

# 运行测试生成 allure 结果
pytest --alluredir=allure-results

# 生成 HTML 报告
allure serve allure-results

# 或静态生成
allure generate allure-results -o allure-report
```

### 自定义报告

```python
# utils/report_generator.py
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict

class TestReportGenerator:
    """测试报告生成器"""
    
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.test_results: List[Dict] = []
    
    def record_test(self, test_name: str, status: str, 
                   duration: float, error: str = None):
        """记录测试结果"""
        self.test_results.append({
            "name": test_name,
            "status": status,
            "duration": duration,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
    
    def generate_html_report(self):
        """生成 HTML 报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = self.output_dir / f"report_{timestamp}.html"
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["status"] == "passed")
        failed = sum(1 for r in self.test_results if r["status"] == "failed")
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Selenium Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .summary {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
        .passed {{ color: green; }}
        .failed {{ color: red; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
    </style>
</head>
<body>
    <h1>🎭 Selenium Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total: {total}</p>
        <p class="passed">✅ Passed: {passed}</p>
        <p class="failed">❌ Failed: {failed}</p>
    </div>
    <table>
        <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
        </tr>
"""
        
        for result in self.test_results:
            html_content += f"""
        <tr>
            <td>{result['name']}</td>
            <td class="{result['status']}">{result['status']}</td>
            <td>{result['duration']:.2f}s</td>
            <td>{result.get('error', '-') or '-'}</td>
        </tr>
"""
        
        html_content += """
    </table>
</body>
</html>
"""
        
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        return report_path
```

## 最佳实践

### 环境管理

```python
# config/environments.py
import os
from dataclasses import dataclass

@dataclass
class Environment:
    """环境配置"""
    name: str
    base_url: str
    timeout: int
    headless: bool

environments = {
    "local": Environment(
        name="local",
        base_url="http://localhost:3000",
        timeout=30,
        headless=False
    ),
    "staging": Environment(
        name="staging",
        base_url="https://staging.example.com",
        timeout=60,
        headless=True
    ),
    "production": Environment(
        name="production",
        base_url="https://example.com",
        timeout=60,
        headless=True
    )
}

def get_environment():
    """获取当前环境"""
    env_name = os.getenv("ENV", "local")
    return environments.get(env_name, environments["local"])
```

### 测试隔离

```python
# tests/test_isolation.py
@pytest.fixture
def unique_email():
    """生成唯一邮箱"""
    import uuid
    return f"test-{uuid.uuid4()}@example.com"

def test_isolation_1(browser, unique_email):
    """测试隔离示例1"""
    browser.get("https://example.com/register")
    browser.find_element(By.NAME, "email").send_keys(unique_email)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    assert browser.find_element(By.CLASS_NAME, "success-message").is_displayed()

def test_isolation_2(browser, unique_email):
    """测试隔离示例2 - 每个测试使用不同的数据"""
    browser.get("https://example.com/register")
    browser.find_element(By.NAME, "email").send_keys(unique_email)
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    assert browser.find_element(By.CLASS_NAME, "success-message").is_displayed()
```

### 浏览器配置

```python
# config/browser_config.py
from selenium.webdriver.chrome.options import Options

def get_chrome_options(headless=False):
    """获取 Chrome 配置"""
    options = Options()
    
    if headless:
        options.add_argument("--headless")
    
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-plugins")
    
    # 禁用图片加载（加速）
    prefs = {"profile.managed_default_content_settings.images": 2}
    options.add_experimental_option("prefs", prefs)
    
    return options
```

## 监控和告警

### GitHub Actions 告警

```yaml
# .github/workflows/notify-failure.yml
name: Notify on Failure

on:
  workflow_run:
    workflows: ["Selenium Tests"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'failure'
    steps:
      - name: Send Slack notification
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
        run: |
          curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d '{"text": "Selenium 测试失败！请检查 GitHub Actions。"}'
```

### 测试监控

```python
# utils/monitoring.py
import requests
from datetime import datetime

class TestMonitor:
    """测试监控"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    def send_notification(self, status: str, total: int, 
                        passed: int, failed: int):
        """发送通知"""
        color = {
            "success": "green",
            "failure": "red",
            "warning": "yellow"
        }.get(status, "gray")
        
        message = {
            "msgtype": "markdown",
            "markdown": {
                "title": f"🎭 Selenium 测试 {status.upper()}",
                "text": f"""
## 测试结果

- **状态**: {status.upper()}
- **总数**: {total}
- **通过**: ✅ {passed}
- **失败**: ❌ {failed}
- **时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
"""
            }
        }
        
        try:
            requests.post(self.webhook_url, json=message)
        except Exception as e:
            print(f"通知发送失败: {e}")
```
