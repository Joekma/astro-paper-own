---
title: Playwright CI/CD 集成与最佳实践
series: playwright
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-ci-cd-integration
description: '详细介绍Playwright在CI/CD环境中的集成，包括GitHub Actions、GitLab CI、Jenkins配置，以及测试报告生成和最佳实践。'
tags:
  - Playwright
  - RPA
  - CI/CD
  - DevOps
draft: false
language: zh-CN
---

## 概述

将 Playwright 集成到 CI/CD 流程中可以实现自动化测试、持续监控和快速反馈。本教程将详细介绍如何在各种 CI/CD 平台上配置 Playwright，并分享企业级的最佳实践。

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
│  │ E2E Test │ ──▶ Playwright ──▶ 截图/报告                   │
│  └────┬─────┘                                               │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────┐                                               │
│  │ Deploy  │ ──▶ Staging ──▶ Production                     │
│  └──────────┘                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 环境配置

### Docker 环境

```dockerfile
# Dockerfile
FROM python:3.11-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    curl \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装 Playwright
RUN pip install playwright && \
    playwright install chromium --with-deps

# 复制项目文件
COPY . .

# 运行测试
CMD ["pytest", "--html=reports/report.html", "--junitxml=reports/results.xml"]
```

```dockerfile
# docker-compose.yml
version: '3.8'

services:
  playwright-tests:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./reports:/app/reports
      - ./screenshots:/app/screenshots
      - ./traces:/app/traces
    environment:
      - BROWSER=chromium
      - HEADLESS=true
      - CI=true
```

### requirements.txt

```txt
playwright==1.40.0
pytest==7.4.3
pytest-playwright==0.4.3
pytest-html==4.1.1
pytest-xdist==3.5.0
pytest-metadata==3.0.0
allure-pytest==2.13.2
pillow==10.1.0
python-dotenv==1.0.0
```

## GitHub Actions 集成

### 基础工作流

```yaml
# .github/workflows/playwright-tests.yml
name: Playwright Tests

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
    
    - name: Install Playwright Browsers
      run: |
        playwright install --with-deps chromium
    
    - name: Run Playwright tests
      run: |
        pytest tests/ \
          --html=reports/report.html \
          --junitxml=reports/results.xml \
          --video=on \
          --trace=on
    
    - name: Upload Playwright Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: reports/
        retention-days: 30
    
    - name: Upload Playwright Traces
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-traces
        path: trace.zip
        retention-days: 7
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: reports/results.xml
    
    - name: Publish Test Report
      uses: mikepenz/action-junit-report@v3
      if: always()
      with:
        report_paths: 'reports/results.xml'
        github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 跨浏览器测试

```yaml
# .github/workflows/multi-browser-tests.yml
name: Multi-Browser Tests

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点
  workflow_dispatch:

jobs:
  chromium:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: playwright install --with-deps chromium
      - name: Run tests
        run: pytest tests/ --browser=chromium
      
  firefox:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: playwright install --with-deps firefox
      - name: Run tests
        run: pytest tests/ --browser=firefox
      
  webkit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: playwright install --with-deps webkit
      - name: Run tests
        run: pytest tests/ --browser=webkit
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
        browser: [chromium, firefox]
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run tests
        run: |
          pytest tests/ \
            --browser=${{ matrix.browser }} \
            --shard=${{ matrix.shard }}/4 \
            --junitxml=reports/results-${{ matrix.shard }}.xml
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.browser }}-${{ matrix.shard }}
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
  - playwright install --with-deps chromium

test:chromium:
  stage: test
  image: python:3.11-slim
  script:
    - pytest tests/ --browser=chromium --html=reports/report-chromium.html
  artifacts:
    when: always
    paths:
      - reports/
      - screenshots/
    expire_in: 7 days

test:firefox:
  stage: test
  image: python:3.11-slim
  script:
    - pytest tests/ --browser=firefox --html=reports/report-firefox.html
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
        BROWSER = 'chromium'
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
                    playwright install --with-deps chromium
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                    pytest tests/ \
                        --browser=$BROWSER \
                        --html=reports/report.html \
                        --junitxml=reports/results.xml \
                        --video=on \
                        --trace=on
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
                    reportName: 'Playwright Report'
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

# 标记
markers =
    slow: marks tests as slow
    smoke: marks tests as smoke tests
    integration: marks tests as integration tests
    ui: marks tests as UI tests

# 报告
addopts = 
    -v
    --tb=short
    --strict-markers
    --html=reports/report.html
    --self-contained-html
    --junitxml=reports/results.xml

# 超时
timeout = 300
timeout_method = thread

# Playwright
playwright_browser = chromium
playwright_base_url = https://example.com
```

### conftest.py

```python
# tests/conftest.py
import pytest
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
import os

def pytest_configure(config):
    """pytest 配置"""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "smoke: marks tests as smoke tests")
    
    # 创建报告目录
    os.makedirs("reports", exist_ok=True)
    os.makedirs("screenshots", exist_ok=True)

@pytest.fixture(scope="session")
def browser_type():
    """获取浏览器类型"""
    return os.getenv("BROWSER", "chromium")

@pytest.fixture(scope="session")
def browser(browser_type):
    """会话级浏览器"""
    with sync_playwright() as p:
        browser = getattr(p, browser_type).launch(
            headless=os.getenv("CI", "false") == "true"
        )
        yield browser
        browser.close()

@pytest.fixture(scope="function")
def context(browser: Browser):
    """函数级上下文"""
    context = browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir="videos/" if os.getenv("RECORD_VIDEO") else None
    )
    yield context
    context.close()

@pytest.fixture(scope="function")
def page(context: BrowserContext):
    """函数级页面"""
    page = context.new_page()
    yield page
    page.close()

@pytest.fixture(scope="function")
def authenticated_page(page: Page):
    """已认证页面"""
    page.goto("https://example.com/login")
    page.fill("#username", os.getenv("TEST_USERNAME", "testuser"))
    page.fill("#password", os.getenv("TEST_PASSWORD", "password"))
    page.click("button[type='submit']")
    page.wait_for_url("**/dashboard")
    return page

@pytest.fixture(autouse=True)
def screenshot_on_failure(page: Page, request):
    """失败时自动截图"""
    yield
    if request.node.rep_call.failed:
        screenshot_dir = "screenshots"
        os.makedirs(screenshot_dir, exist_ok=True)
        page.screenshot(
            path=f"{screenshot_dir}/{request.node.name}.png",
            full_page=True
        )

@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
    """捕获测试结果"""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
```

## 测试报告

### Allure 报告

```bash
# 安装 allure-pytest
pip install allure-pytest

# 运行测试生成 allure 结果
pytest --alluredir=allure-results

# 生成 HTML 报告
allure serve allure-results

# 或者静态生成
allure generate allure-results -o allure-report
```

### 自定义报告生成

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
    
    def record_test(self, test_name: str, status: str, duration: float, 
                    error: str = None, screenshots: List[str] = None):
        """记录测试结果"""
        self.test_results.append({
            "name": test_name,
            "status": status,
            "duration": duration,
            "error": error,
            "screenshots": screenshots or [],
            "timestamp": datetime.now().isoformat()
        })
    
    def generate_html_report(self):
        """生成 HTML 报告"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = self.output_dir / f"report_{timestamp}.html"
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["status"] == "passed")
        failed = sum(1 for r in self.test_results if r["status"] == "failed")
        skipped = sum(1 for r in self.test_results if r["status"] == "skipped")
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Playwright Test Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .summary {{ background: #f5f5f5; padding: 20px; border-radius: 5px; }}
        .passed {{ color: green; }}
        .failed {{ color: red; }}
        .skipped {{ color: orange; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        .screenshot {{ max-width: 300px; cursor: pointer; }}
    </style>
</head>
<body>
    <h1>🎭 Playwright Test Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total: {total}</p>
        <p class="passed">✅ Passed: {passed}</p>
        <p class="failed">❌ Failed: {failed}</p>
        <p class="skipped">⏭️ Skipped: {skipped}</p>
        <p>Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Error</th>
        </tr>
"""
        
        for result in self.test_results:
            status_class = result["status"]
            status_icon = {"passed": "✅", "failed": "❌", "skipped": "⏭️"}.get(result["status"], "")
            
            html_content += f"""
        <tr>
            <td>{result['name']}</td>
            <td class="{status_class}">{status_icon} {result['status']}</td>
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
        
        print(f"Report generated: {report_path}")
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
    api_url: str
    timeout: int
    headless: bool

# 环境定义
environments = {
    "local": Environment(
        name="local",
        base_url="http://localhost:3000",
        api_url="http://localhost:8000/api",
        timeout=30000,
        headless=False
    ),
    "staging": Environment(
        name="staging",
        base_url="https://staging.example.com",
        api_url="https://staging-api.example.com",
        timeout=60000,
        headless=True
    ),
    "production": Environment(
        name="production",
        base_url="https://example.com",
        api_url="https://api.example.com",
        timeout=60000,
        headless=True
    )
}

def get_environment():
    """获取当前环境"""
    env_name = os.getenv("ENV", "local")
    return environments.get(env_name, environments["local"])
```

### 测试数据管理

```python
# fixtures/test_data.py
import pytest
from typing import Dict, List
import json

@pytest.fixture
def test_users() -> List[Dict]:
    """测试用户数据"""
    return [
        {"username": "admin", "password": "admin123", "role": "admin"},
        {"username": "user1", "password": "user123", "role": "user"},
        {"username": "guest", "password": "guest", "role": "guest"}
    ]

@pytest.fixture
def test_products() -> List[Dict]:
    """测试产品数据"""
    return [
        {"id": 1, "name": "Product A", "price": 99.99, "category": "electronics"},
        {"id": 2, "name": "Product B", "price": 49.99, "category": "books"},
        {"id": 3, "name": "Product C", "price": 199.99, "category": "electronics"}
    ]

@pytest.fixture
def mock_api_data() -> Dict:
    """模拟 API 数据"""
    return {
        "users": [
            {"id": 1, "name": "User 1", "email": "user1@example.com"},
            {"id": 2, "name": "User 2", "email": "user2@example.com"}
        ],
        "products": [
            {"id": 1, "name": "Product 1", "price": 100},
            {"id": 2, "name": "Product 2", "price": 200}
        ]
    }
```

### 并行测试配置

```bash
# 使用 pytest-xdist 并行运行
pytest tests/ -n auto

# 指定并行数
pytest tests/ -n 4

# 在不同浏览器上并行
pytest tests/ --browser=chromium -n 2 &
pytest tests/ --browser=firefox -n 2 &
wait
```

### 测试隔离

```python
# tests/test_isolation.py
import pytest

@pytest.fixture
def clean_database():
    """每个测试前清理数据库"""
    # 清理逻辑
    yield
    # 恢复逻辑

@pytest.fixture
def unique_email():
    """生成唯一邮箱"""
    import uuid
    return f"test-{uuid.uuid4()}@example.com"

def test_isolation_1(page, clean_database, unique_email):
    """测试隔离示例1"""
    page.goto("https://example.com/register")
    page.fill("#email", unique_email)
    page.click("button[type='submit']")
    
    # 验证邮箱已注册
    assert page.locator(".success-message").is_visible()

def test_isolation_2(page, clean_database, unique_email):
    """测试隔离示例2"""
    page.goto("https://example.com/register")
    page.fill("#email", unique_email)
    page.click("button[type='submit']")
    
    # 验证邮箱未注册（失败，因为上一个测试已注册）
    # 这展示了测试隔离的重要性
```

## 监控和告警

### 测试结果监控

```python
# utils/monitoring.py
import requests
from datetime import datetime

class TestMonitor:
    """测试监控"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    def send_notification(self, status: str, total: int, passed: int, failed: int):
        """发送通知"""
        color = {
            "success": "green",
            "failure": "red",
            "warning": "yellow"
        }.get(status, "gray")
        
        message = {
            "msgtype": "markdown",
            "markdown": {
                "title": f"🎭 Playwright 测试 {status.upper()}",
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

### GitHub Actions 告警

```yaml
# .github/workflows/notify-failure.yml
name: Notify on Failure

on:
  workflow_run:
    workflows: ["Playwright Tests"]
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
            -d '{"text": "Playwright 测试失败！请检查 GitHub Actions。"}'
```
