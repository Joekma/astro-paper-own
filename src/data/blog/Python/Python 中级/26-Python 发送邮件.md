---
title: Python 发送邮件
author: Joekma
pubDatetime: 2019-03-05T00:00:00Z
slug: python-send-email
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - 邮件
  - docs
description: Python 发送邮件，涵盖smtplib模块、SMTP配置、附件发送等邮件处理技巧。
series: python
seriesOrder: 26
language: zh-CN
---

# Python 发送邮件

![Python 发送邮件通常包含 smtplib 连接 SMTP、TLS 登录、构造 MIME 文本或 HTML、添加附件、选择端口并发送到收件人](./images/python-email-smtp-mime-flow-figure-01.png)

## 使用 `EmailMessage` 与 SMTP 发送

示例只从环境变量读取 SMTP 主机、账号和授权码。仓库中曾出现过疑似真实授权码；内容已删除，但凭据所有者仍应立即在邮箱控制台轮换，因为删除工作区文本不会清除 Git 历史。

完整实践使用本地调试 SMTP 服务器或测试替身，不连接生产邮箱。生产发送必须配置连接超时、TLS、重试上限和可观测日志，日志不得记录授权码或完整邮件正文。

<!-- snippet: id=python-email-build-message mode=run python=3.12-3.14 deps=stdlib -->
```python
from email.message import EmailMessage

message = EmailMessage()
message["From"] = "sender@example.invalid"
message["To"] = "receiver@example.invalid"
message["Subject"] = "测试邮件"
message.set_content("这是一封纯文本测试邮件。")
message.add_alternative("<p>这是一封 <strong>HTML</strong> 测试邮件。</p>", subtype="html")

assert message.get_content_type() == "multipart/alternative"
assert message["Subject"] == "测试邮件"
```

真实发送入口如下。该块依赖外部 SMTP 测试服务，因此只编译，不由文档 CI 发信。

<!-- snippet: id=python-email-smtp-tls mode=compile python=3.12-3.14 deps=stdlib -->
```python
import os
import smtplib
import ssl
from email.message import EmailMessage

def send_message(message: EmailMessage) -> None:
    host = os.environ["SMTP_HOST"]
    username = os.environ["SMTP_USERNAME"]
    password = os.environ["SMTP_PASSWORD"]

    with smtplib.SMTP(host, 587, timeout=10) as client:
        client.ehlo()
        client.starttls(context=ssl.create_default_context())
        client.ehlo()
        client.login(username, password)
        client.send_message(message)
```

附件用 `Path.read_bytes()` 读取，并通过 `EmailMessage.add_attachment()` 添加；发送前限制附件大小和允许的媒体类型。对批量邮件逐个生成收件人头，避免把全部地址暴露在 `To`/`Cc` 中。
