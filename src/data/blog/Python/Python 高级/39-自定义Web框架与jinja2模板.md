---
title: 自定义Web框架与jinja2模板
series: python
seriesOrder: 39
language: zh-CN
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: custom-web-framework-jinja2-template
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - Web开发
  - docs
description: 自定义Web框架与jinja2模板引擎，涵盖WSGI、路由、视图函数与模板渲染等核心内容。
---

# 自定义Web框架与jinja2模板

## WSGI 最小机制与边界

WSGI 应用是接收 `environ` 与 `start_response` 的可调用对象，返回字节迭代器。下面示例只演示协议，不包含路由、认证、请求体解析或静态文件能力。

<!-- snippet: id=custom-wsgi-minimal-app mode=run python=3.12-3.14 deps=stdlib -->
```python
from io import BytesIO

def application(environ, start_response):
    body = b"hello wsgi\n"
    start_response("200 OK", [("Content-Type", "text/plain; charset=utf-8"),
                              ("Content-Length", str(len(body)))])
    return [body]

captured = {}
def start_response(status, headers):
    captured.update(status=status, headers=dict(headers))

body = b"".join(application({"wsgi.input": BytesIO()}, start_response))
assert captured["status"] == "200 OK"
assert body == b"hello wsgi\n"
```

模板渲染必须保留 Jinja 的 HTML 自动转义；SQL 查询必须参数化；密码交给成熟认证库进行自适应哈希。不要在教学框架中自行实现 Cookie 签名、上传路径、生产静态文件或调试错误页。

真实服务优先采用 Django 6.0.7 或 Flask 3.1.3，并通过 Gunicorn 等 WSGI 服务器部署。自制框架的完整测试至少要覆盖重复响应头、空响应、应用异常、迭代器关闭和大请求拒绝。
