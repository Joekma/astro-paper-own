---
title: Playwright RPA 自动化：业务流程自动化
series: playwright
author: Joekma
pubDatetime: 2026-05-09T00:00:00.000+08:00
modDatetime: 2026-05-09T00:00:00.000+08:00
slug: playwright-rpa-automation
description: '详细介绍使用Playwright构建RPA机器人，包括工作流设计、任务调度、错误处理、日志记录等企业级RPA开发实践。'
tags:
  - Playwright
  - RPA
  - 业务流程自动化
  - 机器人
draft: false
language: zh-CN
---

## 概述

RPA（Robotic Process Automation，机器人流程自动化）是一种利用软件机器人自动执行重复性业务流程的技术。Playwright 作为现代网页自动化工具，非常适合构建网页端的 RPA 解决方案。本教程将带你从零构建一个企业级的 RPA 系统。

### RPA 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      RPA 系统架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    调度层                             │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │   │  Cron    │  │ APScheduler│  │ 手动触发 │          │  │
│  │   └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    执行层                             │  │
│  │   ┌──────────────────────────────────────────────┐   │  │
│  │   │              RPA 机器人                        │   │  │
│  │   │  ┌────────┐  ┌────────┐  ┌────────┐        │   │  │
│  │   │  │ 工作流 │  │ 任务   │  │ 监控   │        │   │  │
│  │   │  │ 引擎   │  │ 管理   │  │ 日志   │        │   │  │
│  │   │  └────────┘  └────────┘  └────────┘        │   │  │
│  │   └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│                            ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    浏览器层                            │  │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │   │Playwright│  │ Chromium │  │  多实例   │         │  │
│  │   └──────────┘  └──────────┘  └──────────┘         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## RPA 项目结构

### 项目目录

```
rpa-project/
├── config/
│   ├── __init__.py
│   ├── settings.py        # 全局配置
│   └── robots.yaml        # 机器人配置
├── robots/
│   ├── __init__.py
│   ├── base.py           # 基础机器人
│   ├── order_robot.py    # 订单处理机器人
│   └── report_robot.py   # 报表生成机器人
├── workflows/
│   ├── __init__.py
│   ├── workflow_engine.py # 工作流引擎
│   └── steps.py          # 工作流步骤
├── utils/
│   ├── __init__.py
│   ├── logger.py         # 日志工具
│   ├── notifier.py       # 通知工具
│   └── storage.py        # 存储工具
├── logs/                 # 日志目录
├── outputs/              # 输出目录
├── requirements.txt
└── run.py                # 入口文件
```

## 基础架构

### 配置管理

```python
# config/settings.py
from pathlib import Path
from dataclasses import dataclass
import yaml

@dataclass
class BrowserConfig:
    """浏览器配置"""
    headless: bool = True
    timeout: int = 30000
    viewport_width: int = 1920
    viewport_height: int = 1080
    slow_mo: int = 0

@dataclass
class RPAConfig:
    """RPA 全局配置"""
    browser: BrowserConfig
    retry_times: int = 3
    retry_delay: float = 2.0
    screenshot_on_error: bool = True
    log_level: str = "INFO"
    notification_enabled: bool = True
    
    @classmethod
    def from_yaml(cls, path: str) -> "RPAConfig":
        with open(path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        return cls(**config)

class Settings:
    """全局设置"""
    
    BASE_DIR = Path(__file__).parent.parent
    LOG_DIR = BASE_DIR / "logs"
    OUTPUT_DIR = BASE_DIR / "outputs"
    
    def __init__(self):
        self.LOG_DIR.mkdir(exist_ok=True)
        self.OUTPUT_DIR.mkdir(exist_ok=True)
        
        # 默认配置
        self.rpa = RPAConfig(
            browser=BrowserConfig(headless=False)
        )
    
    def load_config(self, config_file: str):
        """加载配置文件"""
        self.rpa = RPAConfig.from_yaml(config_file)

# 全局实例
settings = Settings()
```

### 日志系统

```python
# utils/logger.py
import logging
from pathlib import Path
from datetime import datetime
from functools import wraps
import traceback

class RPAFormatter(logging.Formatter):
    """RPA 日志格式化器"""
    
    FORMATS = {
        logging.DEBUG: "\033[36m[DEBUG]\033[0m %(message)s",
        logging.INFO: "\033[32m[INFO]\033[0m %(message)s",
        logging.WARNING: "\033[33m[WARNING]\033[0m %(message)s",
        logging.ERROR: "\033[31m[ERROR]\033[0m %(message)s",
        logging.CRITICAL: "\033[35m[CRITICAL]\033[0m %(message)s"
    }
    
    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno, "%(message)s")
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

class RPALogger:
    """RPA 日志记录器"""
    
    def __init__(self, name: str, log_dir: Path):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # 文件处理器
        log_file = log_dir / f"{name}_{datetime.now().strftime('%Y%m%d')}.log"
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        ))
        
        # 控制台处理器
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        ch.setFormatter(RPAFormatter())
        
        self.logger.addHandler(fh)
        self.logger.addHandler(ch)
    
    def debug(self, msg: str):
        self.logger.debug(msg)
    
    def info(self, msg: str):
        self.logger.info(msg)
    
    def warning(self, msg: str):
        self.logger.warning(msg)
    
    def error(self, msg: str, exc_info: bool = False):
        self.logger.error(msg, exc_info=exc_info)
    
    def critical(self, msg: str):
        self.logger.critical(msg)

def log_step(step_name: str):
    """步骤日志装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            self.logger.info(f"➡️  开始步骤: {step_name}")
            try:
                result = func(self, *args, **kwargs)
                self.logger.info(f"✅ 完成步骤: {step_name}")
                return result
            except Exception as e:
                self.logger.error(f"❌ 步骤失败: {step_name} - {e}")
                self.logger.error(traceback.format_exc())
                raise
        return wrapper
    return decorator
```

### 基础机器人

```python
# robots/base.py
from playwright.sync_api import sync_playwright, Browser, BrowserContext, Page
from config.settings import settings, RPAConfig
from utils.logger import RPALogger
from pathlib import Path
from datetime import datetime
import traceback
import time

class BaseRobot:
    """RPA 机器人基类"""
    
    def __init__(self, name: str, config: RPAConfig = None):
        self.name = name
        self.config = config or settings.rpa
        self.logger = RPALogger(name, settings.LOG_DIR)
        self.browser: Browser = None
        self.context: BrowserContext = None
        self.page: Page = None
        
    def __enter__(self):
        self._init_browser()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self._cleanup()
        return False
    
    def _init_browser(self):
        """初始化浏览器"""
        self.logger.info("正在启动浏览器...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.config.browser.headless,
            slow_mo=self.config.browser.slow_mo
        )
        self.context = self.browser.new_context(
            viewport={
                "width": self.config.browser.viewport_width,
                "height": self.config.browser.viewport_height
            }
        )
        self.page = self.context.new_page()
        self.page.set_default_timeout(self.config.browser.timeout)
        self.logger.info("浏览器启动成功")
    
    def _cleanup(self):
        """清理资源"""
        self.logger.info("正在关闭浏览器...")
        if self.page:
            self.page.close()
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        self.logger.info("浏览器已关闭")
    
    def screenshot(self, name: str = None):
        """截图"""
        if not name:
            name = f"{self.name}_{datetime.now().strftime('%H%M%S')}"
        path = settings.OUTPUT_DIR / f"{name}.png"
        self.page.screenshot(path=str(path), full_page=True)
        self.logger.info(f"截图已保存: {path}")
        return path
    
    def error_screenshot(self):
        """错误截图"""
        return self.screenshot(f"{self.name}_error")
    
    def retry(self, func, *args, max_attempts: int = None, **kwargs):
        """重试机制"""
        attempts = max_attempts or self.config.retry_times
        delay = self.config.retry_delay
        
        for i in range(attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if i == attempts - 1:
                    raise
                self.logger.warning(f"尝试 {i+1} 失败: {e}，{delay}秒后重试...")
                time.sleep(delay)
    
    def run(self):
        """运行机器人（子类实现）"""
        raise NotImplementedError
```

## 工作流引擎

### 工作流步骤

```python
# workflows/steps.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class StepResult:
    """步骤执行结果"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    duration: float = 0.0
    screenshot: Optional[str] = None

class WorkflowStep(ABC):
    """工作流步骤基类"""
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.start_time: datetime = None
        self.end_time: datetime = None
    
    @abstractmethod
    def execute(self, context: Dict) -> StepResult:
        """执行步骤"""
        pass
    
    def __str__(self):
        return f"Step({self.name})"

class NavigateStep(WorkflowStep):
    """导航步骤"""
    
    def __init__(self, url: str, wait_until: str = "networkidle"):
        super().__init__("navigate", f"导航到 {url}")
        self.url = url
        self.wait_until = wait_until
    
    def execute(self, context: Dict) -> StepResult:
        start = time.time()
        try:
            page = context["page"]
            page.goto(self.url, wait_until=self.wait_until)
            return StepResult(success=True, duration=time.time() - start)
        except Exception as e:
            return StepResult(success=False, error=str(e), duration=time.time() - start)

class ClickStep(WorkflowStep):
    """点击步骤"""
    
    def __init__(self, selector: str, description: str = ""):
        super().__init__("click", description or f"点击 {selector}")
        self.selector = selector
    
    def execute(self, context: Dict) -> StepResult:
        start = time.time()
        try:
            page = context["page"]
            page.click(self.selector)
            return StepResult(success=True, duration=time.time() - start)
        except Exception as e:
            return StepResult(success=False, error=str(e), duration=time.time() - start)

class FillStep(WorkflowStep):
    """填写步骤"""
    
    def __init__(self, selector: str, value: str, description: str = ""):
        super().__init__("fill", description or f"填写 {selector}")
        self.selector = selector
        self.value = value
    
    def execute(self, context: Dict) -> StepResult:
        start = time.time()
        try:
            page = context["page"]
            page.fill(self.selector, self.value)
            return StepResult(success=True, duration=time.time() - start)
        except Exception as e:
            return StepResult(success=False, error=str(e), duration=time.time() - start)

class WaitStep(WorkflowStep):
    """等待步骤"""
    
    def __init__(self, selector: str = None, timeout: int = 10000, description: str = ""):
        super().__init__("wait", description or f"等待 {selector or str(timeout) + 'ms'}")
        self.selector = selector
        self.timeout = timeout
    
    def execute(self, context: Dict) -> StepResult:
        start = time.time()
        try:
            page = context["page"]
            if self.selector:
                page.wait_for_selector(self.selector, timeout=self.timeout)
            else:
                page.wait_for_timeout(self.timeout)
            return StepResult(success=True, duration=time.time() - start)
        except Exception as e:
            return StepResult(success=False, error=str(e), duration=time.time() - start)

class ExtractStep(WorkflowStep):
    """提取步骤"""
    
    def __init__(self, key: str, selector: str, attribute: str = None, description: str = ""):
        super().__init__("extract", description or f"提取 {selector}")
        self.key = key
        self.selector = selector
        self.attribute = attribute
    
    def execute(self, context: Dict) -> StepResult:
        start = time.time()
        try:
            page = context["page"]
            if self.attribute:
                value = page.locator(self.selector).first.get_attribute(self.attribute)
            else:
                value = page.locator(self.selector).first.inner_text()
            context[self.key] = value
            return StepResult(success=True, data=value, duration=time.time() - start)
        except Exception as e:
            return StepResult(success=False, error=str(e), duration=time.time() - start)

class ConditionStep(WorkflowStep):
    """条件步骤"""
    
    def __init__(self, condition: str, true_steps: List[WorkflowStep], false_steps: List[WorkflowStep] = None):
        super().__init__("condition", f"条件判断: {condition}")
        self.condition = condition
        self.true_steps = true_steps
        self.false_steps = false_steps or []
    
    def execute(self, context: Dict) -> StepResult:
        start = time.time()
        try:
            # 执行条件检查
            result = context["page"].evaluate(self.condition)
            steps = self.true_steps if result else self.false_steps
            
            for step in steps:
                result = step.execute(context)
                if not result.success:
                    return result
            
            return StepResult(success=True, duration=time.time() - start)
        except Exception as e:
            return StepResult(success=False, error=str(e), duration=time.time() - start)
```

### 工作流引擎

```python
# workflows/workflow_engine.py
from .steps import WorkflowStep, StepResult
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import time

@dataclass
class WorkflowResult:
    """工作流执行结果"""
    workflow_name: str
    success: bool
    total_duration: float
    step_results: List[StepResult] = field(default_factory=list)
    error: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)

class WorkflowEngine:
    """工作流引擎"""
    
    def __init__(self, name: str, steps: List[WorkflowStep], context: Dict = None):
        self.name = name
        self.steps = steps
        self.context = context or {}
        self.results: List[StepResult] = []
        self.start_time: datetime = None
        self.end_time: datetime = None
    
    def execute(self) -> WorkflowResult:
        """执行工作流"""
        self.start_time = datetime.now()
        total_start = time.time()
        
        print(f"\n{'='*60}")
        print(f"🚀 开始执行工作流: {self.name}")
        print(f"{'='*60}\n")
        
        try:
            for i, step in enumerate(self.steps):
                print(f"[{i+1}/{len(self.steps)}] {step}")
                
                result = step.execute(self.context)
                self.results.append(result)
                
                if result.success:
                    print(f"    ✅ 成功 ({result.duration:.2f}s)")
                    if result.data:
                        print(f"    📊 数据: {result.data}")
                else:
                    print(f"    ❌ 失败: {result.error}")
                    if result.screenshot:
                        print(f"    📸 截图: {result.screenshot}")
                    raise Exception(result.error)
                
                print()
            
            success = True
            error = None
            
        except Exception as e:
            success = False
            error = str(e)
        
        self.end_time = datetime.now()
        total_duration = time.time() - total_start
        
        result = WorkflowResult(
            workflow_name=self.name,
            success=success,
            total_duration=total_duration,
            step_results=self.results,
            error=error,
            data=self.context
        )
        
        print(f"\n{'='*60}")
        if success:
            print(f"✅ 工作流执行成功! 总耗时: {total_duration:.2f}s")
        else:
            print(f"❌ 工作流执行失败: {error}")
        print(f"{'='*60}\n")
        
        return result
    
    def add_step(self, step: WorkflowStep):
        """添加步骤"""
        self.steps.append(step)
        return self
    
    def insert_step(self, index: int, step: WorkflowStep):
        """插入步骤"""
        self.steps.insert(index, step)
        return self
```

## 实战案例

### 订单处理机器人

```python
# robots/order_robot.py
from robots.base import BaseRobot
from workflows.steps import *
from workflows.workflow_engine import WorkflowEngine
from utils.logger import log_step
from config.settings import settings
import time

class OrderProcessingRobot(BaseRobot):
    """订单处理机器人"""
    
    def __init__(self, order_id: str, **kwargs):
        super().__init__(f"order_robot_{order_id}", **kwargs)
        self.order_id = order_id
        self.order_data = {}
    
    def run(self):
        """运行订单处理"""
        self.logger.info(f"开始处理订单: {self.order_id}")
        
        try:
            # 创建工作流
            workflow = WorkflowEngine(
                name=f"处理订单 {self.order_id}",
                steps=[
                    NavigateStep("https://order.example.com/login"),
                    WaitStep(selector=".login-form"),
                    FillStep("input[name='username']", "admin"),
                    FillStep("input[name='password']", "password123"),
                    ClickStep("button[type='submit']"),
                    WaitStep(selector=".dashboard"),
                    NavigateStep(f"https://order.example.com/order/{self.order_id}"),
                    WaitStep(selector=".order-detail"),
                    ExtractStep("order_status", ".order-status"),
                    ExtractStep("customer_name", ".customer-name"),
                    ExtractStep("total_amount", ".total-amount"),
                    ClickStep("button.confirm"),
                    WaitStep(selector=".confirmation-modal"),
                    ClickStep("button.confirm-action"),
                    WaitStep(selector=".success-message")
                ],
                context={"page": self.page, "order_id": self.order_id}
            )
            
            result = workflow.execute()
            
            if result.success:
                self.logger.info(f"订单处理成功: {result.data}")
            else:
                self.logger.error(f"订单处理失败: {result.error}")
                self.error_screenshot()
            
            return result
            
        except Exception as e:
            self.logger.error(f"订单处理异常: {e}")
            self.error_screenshot()
            raise
```

### 报表生成机器人

```python
# robots/report_robot.py
from robots.base import BaseRobot
from workflows.steps import *
from workflows.workflow_engine import WorkflowEngine
from pathlib import Path
from datetime import datetime, timedelta
import json

class ReportGenerationRobot(BaseRobot):
    """报表生成机器人"""
    
    def __init__(self, report_type: str, date_range: tuple, **kwargs):
        super().__init__(f"report_robot_{report_type}", **kwargs)
        self.report_type = report_type
        self.start_date, self.end_date = date_range
        self.report_data = []
    
    @log_step("登录系统")
    def login(self):
        self.page.goto("https://report.example.com/login")
        self.page.wait_for_selector(".login-form")
        self.page.fill("input[name='username']", "reporter")
        self.page.fill("input[name='password']", "report123")
        self.page.click("button[type='submit']")
        self.page.wait_for_selector(".dashboard", timeout=10000)
    
    @log_step("选择报表类型")
    def select_report_type(self):
        self.page.goto("https://report.example.com/reports")
        self.page.wait_for_selector(".report-list")
        
        report_map = {
            "sales": ".report-sales",
            "inventory": ".report-inventory",
            "financial": ".report-financial"
        }
        
        selector = report_map.get(self.report_type)
        if selector:
            self.page.click(selector)
        else:
            raise ValueError(f"未知报表类型: {self.report_type}")
    
    @log_step("设置日期范围")
    def set_date_range(self):
        self.page.fill("input[name='start_date']", self.start_date)
        self.page.fill("input[name='end_date']", self.end_date)
        self.page.click("button.apply-filter")
        self.page.wait_for_load_state("networkidle")
    
    @log_step("导出报表")
    def export_report(self):
        self.page.click("button.export")
        self.page.select_option("select.export-format", "csv")
        self.page.click("button.download")
        self.wait_for_download()
    
    def wait_for_download(self):
        """等待下载完成"""
        with self.page.expect_download() as download_info:
            self.page.click("button.confirm-download")
        download = download_info.value
        return download.save_as(settings.OUTPUT_DIR / f"report_{datetime.now().strftime('%Y%m%d')}.csv")
    
    def run(self):
        """运行报表生成"""
        try:
            self.login()
            self.select_report_type()
            self.set_date_range()
            filepath = self.export_report()
            
            self.logger.info(f"报表生成成功: {filepath}")
            return {"success": True, "filepath": filepath}
            
        except Exception as e:
            self.logger.error(f"报表生成失败: {e}")
            self.error_screenshot()
            return {"success": False, "error": str(e)}
```

## 任务调度

### APScheduler 集成

```python
# scheduler.py
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging

class RPAScheduler:
    """RPA 任务调度器"""
    
    def __init__(self):
        self.scheduler = BlockingScheduler()
        self.logger = logging.getLogger("scheduler")
    
    def add_job(self, func, trigger: str, **kwargs):
        """添加任务"""
        if trigger == "cron":
            cron_kwargs = {k: v for k, v in kwargs.items() if k in 
                          ["second", "minute", "hour", "day", "month", "weekday"]}
            job_id = kwargs.get("id", func.__name__)
            self.scheduler.add_job(
                func,
                CronTrigger(**cron_kwargs),
                id=job_id,
                replace_existing=True
            )
            self.logger.info(f"已添加 Cron 任务: {job_id}")
            
        elif trigger == "interval":
            interval_kwargs = {
                "seconds": kwargs.get("seconds"),
                "minutes": kwargs.get("minutes"),
                "hours": kwargs.get("hours"),
                "days": kwargs.get("days")
            }
            interval_kwargs = {k: v for k, v in interval_kwargs.items() if v}
            job_id = kwargs.get("id", func.__name__)
            self.scheduler.add_job(
                func,
                IntervalTrigger(**interval_kwargs),
                id=job_id,
                replace_existing=True
            )
            self.logger.info(f"已添加 Interval 任务: {job_id}")
    
    def start(self):
        """启动调度器"""
        self.logger.info("调度器启动...")
        self.scheduler.start()
    
    def stop(self):
        """停止调度器"""
        self.scheduler.shutdown()
        self.logger.info("调度器已停止")

# 使用示例
def job_daily_report():
    from robots.report_robot import ReportGenerationRobot
    from config.settings import settings
    
    with ReportGenerationRobot(
        report_type="sales",
        date_range=(
            (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            datetime.now().strftime("%Y-%m-%d")
        )
    ) as robot:
        result = robot.run()
    
    return result

# 调度任务
scheduler = RPAScheduler()
scheduler.add_job(
    job_daily_report,
    trigger="cron",
    hour=8,
    minute=0,
    id="daily_sales_report"
)
scheduler.start()
```

### 手动触发

```python
# manual_trigger.py
def trigger_robot(robot_class, **kwargs):
    """手动触发机器人"""
    print(f"🔄 启动 {robot_class.__name__}...")
    
    robot = robot_class(**kwargs)
    result = robot.run()
    
    if result.success:
        print(f"✅ 机器人执行成功")
    else:
        print(f"❌ 机器人执行失败: {result.error}")
    
    return result

# 命令行使用
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("robot", choices=["order", "report"])
    parser.add_argument("--id", help="订单ID")
    parser.add_argument("--type", help="报表类型")
    args = parser.parse_args()
    
    if args.robot == "order":
        from robots.order_robot import OrderProcessingRobot
        trigger_robot(OrderProcessingRobot, order_id=args.id)
    
    elif args.robot == "report":
        from robots.report_robot import ReportGenerationRobot
        trigger_robot(
            ReportGenerationRobot,
            report_type=args.type,
            date_range=(datetime.now().strftime("%Y-%m-%d"), datetime.now().strftime("%Y-%m-%d"))
        )
```

## 监控和通知

### 通知系统

```python
# utils/notifier.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
import requests

class Notifier:
    """通知器基类"""
    
    def send(self, title: str, message: str):
        raise NotImplementedError

class EmailNotifier(Notifier):
    """邮件通知"""
    
    def __init__(self, smtp_server: str, port: int, username: str, password: str, to_emails: List[str]):
        self.smtp_server = smtp_server
        self.port = port
        self.username = username
        self.password = password
        self.to_emails = to_emails
    
    def send(self, title: str, message: str):
        msg = MIMEMultipart()
        msg["From"] = self.username
        msg["To"] = ", ".join(self.to_emails)
        msg["Subject"] = title
        msg.attach(MIMEText(message, "plain"))
        
        with smtplib.SMTP(self.smtp_server, self.port) as server:
            server.starttls()
            server.login(self.username, self.password)
            server.send_message(msg)

class DingTalkNotifier(Notifier):
    """钉钉通知"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    def send(self, title: str, message: str):
        data = {
            "msgtype": "markdown",
            "markdown": {
                "title": title,
                "text": f"## {title}\n\n{message}"
            }
        }
        requests.post(self.webhook_url, json=data)

class WeComNotifier(Notifier):
    """企业微信通知"""
    
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
    
    def send(self, title: str, message: str):
        data = {
            "msgtype": "markdown",
            "markdown": {
                "content": f"### {title}\n\n{message}"
            }
        }
        requests.post(self.webhook_url, json=data)
```

### 监控集成

```python
# utils/monitor.py
from dataclasses import dataclass
from datetime import datetime
from typing import List
import json
from pathlib import Path

@dataclass
class RobotMetrics:
    """机器人指标"""
    robot_name: str
    start_time: datetime
    end_time: datetime
    duration: float
    success: bool
    error: str = None

class MetricsCollector:
    """指标收集器"""
    
    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
        self.metrics: List[RobotMetrics] = []
    
    def record(self, metrics: RobotMetrics):
        """记录指标"""
        self.metrics.append(metrics)
        self._persist()
    
    def _persist(self):
        """持久化"""
        data = [
            {
                "robot_name": m.robot_name,
                "start_time": m.start_time.isoformat(),
                "end_time": m.end_time.isoformat(),
                "duration": m.duration,
                "success": m.success,
                "error": m.error
            }
            for m in self.metrics
        ]
        
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def get_summary(self) -> dict:
        """获取统计摘要"""
        total = len(self.metrics)
        success = sum(1 for m in self.metrics if m.success)
        
        return {
            "total_runs": total,
            "success_rate": success / total if total > 0 else 0,
            "avg_duration": sum(m.duration for m in self.metrics) / total if total > 0 else 0
        }
```
