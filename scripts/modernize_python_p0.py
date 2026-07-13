"""Replace high-risk, copyable legacy sections with safe Python 3.12+ examples."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).parents[1] / "src/data/blog/Python"


def replace_section(path: Path, start: str, end: str, replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    pattern = rf"(?ms)^{re.escape(start)}\s*$.*?(?=^{re.escape(end)}\s*$)"
    updated, count = re.subn(pattern, replacement.rstrip() + "\n\n", text, count=1)
    if count == 0:
        return
    path.write_text(updated, encoding="utf-8", newline="\n")


def replace_after(path: Path, start: str, replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    pattern = rf"(?ms)^{re.escape(start)}\s*$.*\Z"
    updated, count = re.subn(pattern, replacement.rstrip() + "\n", text, count=1)
    if count == 0:
        return
    path.write_text(updated, encoding="utf-8", newline="\n")


def main() -> None:
    replace_section(
        ROOT / "Python 基础/10-Python 内置函数与匿名函数：71个内置函数详解.md",
        "## 字符串类型执行相关",
        "## 输入输出相关",
        """## 字符串解析与动态代码边界

`eval()` 和 `exec()` 会执行 Python 代码，不能用于解析用户输入、配置、网络响应或数据库字段。即使限制 `globals`/`locals`，也不能把它们改造成可靠的安全沙箱。

需要解析 Python 字面量时，使用 `ast.literal_eval()`；跨系统交换数据优先使用 JSON，并在解析后校验字段、类型和大小。

<!-- snippet: id=python-built-in-functions-safe-literal-eval mode=run python=3.12-3.14 deps=stdlib -->
```python
import ast
import json

literal = ast.literal_eval("{'names': ['Ada', 'Lin'], 'enabled': True}")
payload = json.loads('{"page": 2, "size": 20}')

assert literal["enabled"] is True
assert payload == {"page": 2, "size": 20}
```

`compile()` 的合理用途主要是开发工具、模板引擎或受控代码生成。它只负责生成代码对象，并不会验证代码是否安全。业务系统如果需要“可配置表达式”，应定义允许的操作符并解析 AST，或采用成熟的受限表达式语言，而不是执行任意 Python 源码。""",
    )

    replace_section(
        ROOT / "Python 基础/14-Python 常用模块：hashlib、subprocess、logging、re、collections.md",
        "## subprocess 模块",
        "## logging 模块",
        """## subprocess 模块

`subprocess.run()` 是执行一次外部程序的默认入口。参数使用列表传递，避免经过 shell；同时设置超时、捕获文本输出并用 `check=True` 把非零退出码变成异常。

<!-- snippet: id=python-subprocess-safe-run mode=run python=3.12-3.14 deps=stdlib -->
```python
import subprocess
import sys

completed = subprocess.run(
    [sys.executable, "-I", "-c", "print('child-ok')"],
    check=True,
    capture_output=True,
    text=True,
    timeout=5,
)
assert completed.stdout.strip() == "child-ok"
```

当命令失败时，`CalledProcessError` 保存退出码和捕获到的输出；超时则抛 `TimeoutExpired`。只有确实需要持续交互时才使用 `Popen`，并通过 `communicate(timeout=...)` 同时读写，超时后先终止、再回收，避免死锁或僵尸进程。

<!-- snippet: id=python-subprocess-expected-failure mode=expected-error python=3.12-3.14 deps=stdlib error=CalledProcessError -->
```python
import subprocess
import sys

subprocess.run(
    [sys.executable, "-I", "-c", "raise SystemExit(3)"],
    check=True,
    timeout=5,
)
```

如果要实现“前一个程序的输出交给后一个程序”，创建两个 `Popen` 并直接连接管道，或在 Python 中处理捕获到的数据；不要把含用户输入的字符串交给 `shell=True`。""",
    )

    replace_section(
        ROOT / "Python 基础/15-Python 常用模块：shutil、json、pickle、shelve、xml、configparser.md",
        "## shutil 模块",
        "## json 与 pickle",
        """## shutil 与安全归档

`shutil` 适合复制、移动、删除和创建归档。所有路径先解析到预期根目录内；递归删除前再次确认目标，避免把空变量或父目录当成删除目标。

解压来自外部的 ZIP/TAR 时不能直接调用无检查的批量解压。先限制成员数量和总大小，再验证每个成员解析后的路径仍位于目标目录；符号链接和设备文件默认拒绝。

<!-- snippet: id=python-safe-zip-extraction mode=run python=3.12-3.14 deps=stdlib -->
```python
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile

def safe_extract_zip(archive: Path, destination: Path, *, max_bytes: int = 1_000_000) -> None:
    root = destination.resolve()
    with ZipFile(archive) as zf:
        infos = zf.infolist()
        if len(infos) > 100 or sum(item.file_size for item in infos) > max_bytes:
            raise ValueError("archive is too large")
        for item in infos:
            target = (root / item.filename).resolve()
            if not target.is_relative_to(root):
                raise ValueError("archive member escapes destination")
        zf.extractall(root)

with TemporaryDirectory() as tmp:
    root = Path(tmp)
    archive = root / "example.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as zf:
        zf.writestr("docs/readme.txt", "safe")
    out = root / "out"
    safe_extract_zip(archive, out)
    assert (out / "docs/readme.txt").read_text() == "safe"
```
""",
    )

    replace_section(
        ROOT / "Python 基础/15-Python 常用模块：shutil、json、pickle、shelve、xml、configparser.md",
        "## json 与 pickle",
        "## shelve 模块",
        """## JSON 与 pickle 的信任边界

JSON 只表示字符串、数字、布尔值、空值、数组和对象，适合作为跨进程/跨语言交换格式。解析后仍要验证结构、字段类型、数值范围和输入大小。

<!-- snippet: id=python-json-validated-roundtrip mode=run python=3.12-3.14 deps=stdlib -->
```python
import json

text = '{"name": "Ada", "roles": ["reader"]}'
data = json.loads(text)
if not isinstance(data.get("name"), str) or not all(
    isinstance(role, str) for role in data.get("roles", [])
):
    raise ValueError("invalid payload")

encoded = json.dumps(data, ensure_ascii=False, sort_keys=True)
assert json.loads(encoded) == data
```

`pickle` 能在反序列化时导入模块并调用对象构造逻辑，因此加载恶意数据可能直接执行代码。它只适用于同一信任域内、由当前应用自己生成并完整保护的数据；不得读取上传文件、Cookie、缓存中的不可信值或网络消息。`shelve` 内部同样使用 pickle，信任边界完全相同。

如果只需要保存普通数据，选择 JSON；需要带 schema 的跨系统协议时选择明确的序列化格式并验证 schema。不要把“签名了 pickle”当成长期存储设计：密钥泄露、算法迁移和对象代码变化都会放大风险。""",
    )

    mail = ROOT / "Python 中级/26-Python 发送邮件.md"
    replace_after(
        mail,
        "##  使用smtplib模块发送邮件",
        """## 使用 `EmailMessage` 与 SMTP 发送

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

## 复习题

1. 为什么 SMTP 授权码即使从当前文件删除后仍必须轮换？
2. `starttls()` 前后为什么都应执行 EHLO，且 TLS 上下文不能关闭证书校验？
3. 批量发送、附件和失败重试分别需要哪些资源与隐私边界？""",
    )

    replace_section(
        ROOT / "Python 常用外部库/49-Python PyMySQL 详解.md", "## IDE工具介绍", "## 复习题",
        """## PyMySQL 事务实践

本文基于 PyMySQL 1.1.2。连接信息全部来自环境变量，连接和游标使用上下文管理器；SQL 中的值只通过 `%s` 占位符绑定。占位符不加引号，驱动会按类型完成转义和传输。

<!-- snippet: id=python-pymysql-transaction mode=service python=3.12-3.14 deps=pymysql==1.1.2 service=mysql -->
```python
import os
import pymysql
from pymysql.cursors import DictCursor

def find_user(username: str) -> dict | None:
    connection = pymysql.connect(
        host=os.environ.get("MYSQL_HOST", "127.0.0.1"),
        port=int(os.environ.get("MYSQL_PORT", "3306")),
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
        charset="utf8mb4",
        cursorclass=DictCursor,
        connect_timeout=5,
        read_timeout=5,
        write_timeout=5,
        autocommit=False,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, username FROM users WHERE username = %s LIMIT 1",
                (username,),
            )
            row = cursor.fetchone()
        connection.commit()
        return row
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
```

表名、列名和排序方向不能作为值参数绑定；如果业务允许用户选择排序字段，必须把输入映射到代码中的固定白名单。密码不参与 SQL 明文比较：注册时使用框架的自适应密码哈希，查询用户后再调用密码验证 API。

批量写入使用 `executemany()`，大结果集分批读取；事务只包围一个业务原子操作。捕获异常后必须回滚并继续抛出，不能打印后假装成功。""",
    )

    replace_section(
        ROOT / "Python 常用外部库/52-Python SQLAlchemy ORM 详解.md", "## 介绍", "## 复习题",
        """## SQLAlchemy 2.0 typed declarative

本文锁定 SQLAlchemy 2.0.51。2.0 风格以 `DeclarativeBase`、`Mapped`、`mapped_column()`、`select()` 和显式事务为主，不再使用 `Query.get()`、隐式 autocommit 或字符串形式的裸 SQL。

<!-- snippet: id=python-sqlalchemy-typed-model mode=compile python=3.12-3.14 deps=sqlalchemy==2.0.51 -->
```python
from sqlalchemy import String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "user"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)

engine = create_engine("sqlite+pysqlite:///:memory:")
Base.metadata.create_all(engine)

with Session(engine) as session, session.begin():
    session.add_all([User(name="Ada"), User(name="Lin")])

with Session(engine) as session:
    names = session.scalars(select(User.name).order_by(User.id)).all()
    assert names == ["Ada", "Lin"]
```

`Session` 同时承担身份映射和工作单元：对象进入会话，flush 把变更转换成 SQL，commit 提交事务。会话不是全局缓存，也不能跨线程共享。Web 请求通常“一请求一会话”，在响应结束时关闭。

关系加载默认要警惕 N+1。列表页根据访问方式选择 `selectinload()` 或 `joinedload()`，并用测试断言查询次数。执行文本 SQL 必须用 `text()` 和参数字典；动态标识符仍然只能来自白名单。""",
    )

    replace_section(
        ROOT / "Python 高级/38-自定制ORM.md", "## 前言", "## 复习题",
        """## 教学版表达式编译器

自制 ORM 适合学习“字段描述 → 表达式树 → 参数化 SQL”这条链，不适合直接承担生产事务、迁移、关系加载和并发会话。本节只实现不会连接数据库的最小编译器，重点是值与 SQL 文本严格分离。

<!-- snippet: id=custom-orm-safe-compiler mode=run python=3.12-3.14 deps=stdlib -->
```python
from dataclasses import dataclass
from typing import Any

ALLOWED_COLUMNS = {"id", "username", "created_at"}

@dataclass(frozen=True)
class Equals:
    column: str
    value: Any

def compile_select(table: str, condition: Equals) -> tuple[str, tuple[Any, ...]]:
    if table != "users" or condition.column not in ALLOWED_COLUMNS:
        raise ValueError("unknown SQL identifier")
    sql = f"SELECT id, username FROM users WHERE {condition.column} = %s LIMIT 100"
    return sql, (condition.value,)

sql, params = compile_select("users", Equals("username", "Ada' OR 1=1 --"))
assert params == ("Ada' OR 1=1 --",)
assert params[0] not in sql
```

这里的 f-string 只插入通过白名单验证的标识符；用户值始终留在参数元组中。真正 ORM 还需要方言适配、事务、连接池、身份映射、工作单元、迁移、关系加载和并发隔离，任何一项处理错误都可能造成数据损坏。

生产项目应使用 SQLAlchemy 2.0 等成熟实现。本示例的正确终点是理解抽象边界，而不是继续扩展成缺少安全审计的数据库框架。""",
    )

    replace_section(
        ROOT / "Python 高级/39-自定义Web框架与jinja2模板.md", "## web应用与web框架", "## 复习题",
        """## WSGI 最小机制与边界

WSGI 应用是接收 `environ` 与 `start_response` 的可调用对象，返回字节迭代器。下面示例只演示协议，不包含路由、认证、请求体解析或静态文件能力。

<!-- snippet: id=custom-wsgi-minimal-app mode=run python=3.12-3.14 deps=stdlib -->
```python
from io import BytesIO

def application(environ, start_response):
    body = b"hello wsgi\\n"
    start_response("200 OK", [("Content-Type", "text/plain; charset=utf-8"),
                              ("Content-Length", str(len(body)))])
    return [body]

captured = {}
def start_response(status, headers):
    captured.update(status=status, headers=dict(headers))

body = b"".join(application({"wsgi.input": BytesIO()}, start_response))
assert captured["status"] == "200 OK"
assert body == b"hello wsgi\\n"
```

模板渲染必须保留 Jinja 的 HTML 自动转义；SQL 查询必须参数化；密码交给成熟认证库进行自适应哈希。不要在教学框架中自行实现 Cookie 签名、上传路径、生产静态文件或调试错误页。

真实服务优先采用 Django 6.0.7 或 Flask 3.1.3，并通过 Gunicorn 等 WSGI 服务器部署。自制框架的完整测试至少要覆盖重复响应头、空响应、应用异常、迭代器关闭和大请求拒绝。""",
    )

    replace_section(
        ROOT / "Django/16-Django Form 组件详解.md", "## Forms组件概述", "## 复习题",
        """## Django 6 表单验证实践

表单把不可信请求数据转换为经过验证的 Python 值。只有 `is_valid()` 返回真后才能读取 `cleaned_data`；字段错误和跨字段错误分别放在对应字段与 `__all__` 下。

<!-- snippet: id=django-form-safe-registration mode=project python=3.12-3.14 deps=django==6.0.7 file=accounts/forms.py -->
```python
from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

class RegistrationForm(forms.Form):
    username = forms.CharField(max_length=150)
    password1 = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput)

    def clean_password1(self):
        password = self.cleaned_data["password1"]
        validate_password(password)
        return password

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("password1") != cleaned.get("password2"):
            self.add_error("password2", "两次密码不一致")
        return cleaned

    def save(self):
        return get_user_model().objects.create_user(
            username=self.cleaned_data["username"],
            password=self.cleaned_data["password1"],
        )
```

模板中的 POST 表单必须包含 `{% csrf_token %}`。视图用 `form = RegistrationForm(request.POST or None)` 绑定数据，成功后调用 `save()` 并重定向，避免刷新重复提交。不要把 `cleaned_data` 中的密码直接赋给模型字段；`create_user()`/`set_password()` 才会生成密码哈希。

测试应覆盖弱密码、两次密码不一致、重复用户名、CSRF 缺失以及成功后数据库中密码不可读且 `check_password()` 为真。""",
    )

    replace_section(
        ROOT / "Django/19-Django 与 Ajax 异步交互.md", "## 什么是Ajax", "## 复习题",
        """## Fetch、JSON 与 CSRF

Ajax 只是浏览器在不整页跳转的情况下发起 HTTP 请求。服务端仍需做认证、授权、CSRF、大小限制和数据验证；前端字段不可信。

<!-- snippet: id=django-fetch-csrf mode=display python=3.12-3.14 deps=stdlib -->
```javascript
const response = await fetch("/api/profile/", {
  method: "POST",
  headers: {"Content-Type": "application/json", "X-CSRFToken": csrfToken},
  credentials: "same-origin",
  body: JSON.stringify({display_name: "Ada"}),
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

<!-- snippet: id=django-json-view-safe mode=project python=3.12-3.14 deps=django==6.0.7 file=profiles/views.py -->
```python
import json
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@login_required
@require_POST
def update_profile(request):
    if len(request.body) > 16_384:
        return JsonResponse({"error": "payload too large"}, status=413)
    try:
        payload = json.loads(request.body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"error": "invalid json"}, status=400)
    name = payload.get("display_name")
    if not isinstance(name, str) or not 1 <= len(name) <= 80:
        return JsonResponse({"error": "invalid display_name"}, status=400)
    request.user.first_name = name
    request.user.save(update_fields=["first_name"])
    return JsonResponse({"display_name": name})
```

上传使用 `request.FILES`，同时限制请求大小、扩展名、探测后的媒体类型和图片像素；文件名由服务端重新生成并存到不可执行位置。下载时再设置安全的 `Content-Disposition`。测试客户端需覆盖缺失 CSRF、未登录、错误 JSON、超限正文和重复请求。""",
    )

    replace_section(
        ROOT / "Django/21-Django+nginx+uwsgi部署教程（centos7+ubuntu16.4）.md", "## 原理介绍", "## 复习题",
        """## Ubuntu 24.04 + Gunicorn + Nginx + systemd

CentOS 7、Ubuntu 16.04 和 Python 2 均已退出本文主线。部署基线为 Ubuntu 24.04、Python 3.12、Django 6.0.7、Gunicorn、Nginx 与 systemd。应用进程只监听本机 Unix socket，TLS 和静态文件由 Nginx 处理。

<!-- snippet: id=django-deploy-install mode=display python=3.12-3.14 deps=stdlib -->
```bash
python3 -m venv /srv/example/.venv
/srv/example/.venv/bin/python -m pip install --require-hashes -r requirements.txt
/srv/example/.venv/bin/python manage.py check --deploy
/srv/example/.venv/bin/python manage.py migrate --noinput
/srv/example/.venv/bin/python manage.py collectstatic --noinput
```

<!-- snippet: id=django-gunicorn-systemd mode=display python=3.12-3.14 deps=stdlib file=/etc/systemd/system/example.service -->
```ini
[Service]
User=example
Group=www-data
WorkingDirectory=/srv/example/app
EnvironmentFile=/etc/example.env
ExecStart=/srv/example/.venv/bin/gunicorn config.wsgi:application --bind unix:/run/example/gunicorn.sock --workers 3 --timeout 30 --access-logfile - --error-logfile -
RuntimeDirectory=example
Restart=on-failure
PrivateTmp=true
NoNewPrivileges=true
```

<!-- snippet: id=django-nginx-proxy mode=display python=3.12-3.14 deps=stdlib file=/etc/nginx/sites-available/example -->
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    client_max_body_size 10m;
    location /static/ { alias /srv/example/static/; }
    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 35s;
        proxy_pass http://unix:/run/example/gunicorn.sock;
    }
}
```

生产设置必须包含 `DEBUG=False`、精确 `ALLOWED_HOSTS`、环境注入的 `SECRET_KEY`、HTTPS Cookie、可信代理配置和日志轮转。发布顺序应支持回滚：备份/兼容迁移 → 静态资源 → 滚动重启 → 健康检查。不要用 root 运行应用，也不要把开发服务器暴露到公网。""",
    )

    payment_practice = """## 当前接入边界

本文只采用支付机构当前开放平台的 API 和官方提供的 SDK/示例。旧版 MD5/SHA-1 签名、客户端成功页入账和未验签回调已经删除。平台接口、证书格式和 SDK 会独立更新，接入前必须再次核对开放平台文档，并在官方沙箱/测试商户中运行。

私钥、API 密钥和证书不进入源码。创建订单时服务端生成不可预测的业务订单号，以最小货币单位保存金额；客户端只提交商品/订单意图，不能决定最终金额或商户号。

## 回调状态机与沙箱实践

真实验签必须调用该支付机构当前官方验签入口，并把未经重新编码的原始请求体、签名头和平台证书交给它。验签通过后，再把标准化字段交给下面的纯业务函数；该函数不替代官方验签。

<!-- snippet: id=payment-callback-state-machine mode=sandbox python=3.12-3.14 deps=stdlib -->
```python
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class Order:
    merchant_id: str
    amount: Decimal
    currency: str = "CNY"
    status: str = "PENDING"
    platform_txn: str | None = None

def apply_verified_callback(order: Order, event: dict[str, str]) -> bool:
    if event["merchant_id"] != order.merchant_id:
        raise ValueError("merchant mismatch")
    if Decimal(event["amount"]) != order.amount or event["currency"] != order.currency:
        raise ValueError("amount mismatch")
    if order.status == "PAID":
        return False  # 平台至少一次投递：重复通知直接返回成功
    if order.status != "PENDING" or event["status"] != "SUCCESS":
        raise ValueError("illegal state transition")
    order.status = "PAID"
    order.platform_txn = event["transaction_id"]
    return True

order = Order(merchant_id="merchant-test", amount=Decimal("88.00"))
event = {"merchant_id": "merchant-test", "amount": "88.00", "currency": "CNY",
         "status": "SUCCESS", "transaction_id": "sandbox-txn-1"}
assert apply_verified_callback(order, event) is True
assert apply_verified_callback(order, event) is False
```

数据库实现中，读取订单、检查状态、写入平台流水号和记录幂等键必须位于同一事务；订单号和平台流水号都加唯一约束。处理时间戳/nonce 的允许窗口，拒绝过期重放。事务失败时让平台稍后重试，不能先返回成功再异步入账。

## 必测失败路径

| 场景 | 预期行为 |
| --- | --- |
| 签名错误、证书不可信或请求体被改动 | 在任何业务查询/写入前拒绝 |
| 商户号、订单号、金额或币种不匹配 | 记录安全事件并拒绝入账 |
| 同一通知重复或并发到达 | 只入账一次，重复请求得到平台要求的成功响应 |
| 回调过期或 nonce 已使用 | 作为重放拒绝 |
| 数据库事务失败 | 回滚全部状态，让平台按协议重试 |

退款与撤销同样是状态机：使用独立退款单号和金额约束，异步结果仍需验签、核对并幂等处理。生产监控只记录订单号、平台流水号和错误分类，不记录私钥、完整签名材料或敏感用户数据。"""

    replace_section(ROOT / "Python 高级/40-Python 微信支付 详解.md", "##  简介", "## 复习题", payment_practice.replace(
        "本文只采用支付机构当前开放平台", "微信支付接入使用 API v3。本文只采用微信支付当前开放平台"
    ).replace("当前官方验签入口", "API v3 平台证书验签入口").replace("payment-callback-state-machine", "wechatpay-v3-callback-state-machine"))
    replace_section(ROOT / "Python 高级/41-Python 支付宝支付 详解.md", "## 简介", "## 复习题", payment_practice.replace(
        "本文只采用支付机构当前开放平台", "支付宝接入使用开放平台当前 API。本文只采用支付宝当前开放平台"
    ).replace("当前官方验签入口", "开放平台证书模式的官方验签入口").replace("payment-callback-state-machine", "alipay-callback-state-machine"))
    replace_section(ROOT / "Python 高级/42-Python 银联卡支付 详解.md", "## 简介", "## 复习题", payment_practice.replace(
        "本文只采用支付机构当前开放平台", "银联接入使用开放平台当前网关和证书体系。本文只采用银联当前开放平台"
    ).replace("当前官方验签入口", "开放平台当前证书验签入口").replace("payment-callback-state-machine", "unionpay-callback-state-machine"))

    replace_section(
        ROOT / "Python 中级/31-Web身份认证：Cookie、Session与Token.md", "## 认证技术发展史", "## 复习题",
        """## 认证、会话与授权

认证回答“你是谁”，会话让多个请求连续关联到该身份，授权回答“你能否操作这个资源”。登录成功不等于拥有所有权限；每个服务端请求仍需对象级授权。

浏览器应用通常优先使用服务端 Session：Cookie 只保存至少 128 位熵的随机会话 ID，服务端保存用户、创建时间、最后活动时间和撤销状态。登录/提权后轮换 ID，退出时服务端失效。Cookie 至少设置 `Secure`、`HttpOnly` 和适合业务的 `SameSite`；所有依赖 Cookie 修改状态的请求启用 CSRF Token。

<!-- snippet: id=web-auth-random-session-id mode=run python=3.12-3.14 deps=stdlib -->
```python
import secrets

session_id = secrets.token_urlsafe(32)
assert len(session_id) >= 43
assert session_id != secrets.token_urlsafe(32)
```

密码使用框架提供的 Argon2id、scrypt 或带升级参数的 PBKDF2 等自适应哈希；禁止明文、MD5、SHA-1 或一次 SHA-256。登录、验证码、找回密码和刷新令牌端点都需要限流、统一错误信息和审计日志。

## Token/JWT 校验清单

JWT 是签名容器，不是加密容器。使用成熟库并固定允许的算法，验证签名、`iss`、`aud`、`exp`、`nbf`，限制时钟偏差和令牌大小；不要接受令牌头动态指定任意算法/密钥。访问令牌保持短期，刷新令牌轮换并能撤销，密钥按 `kid` 平滑轮换。

| 失败路径 | 必须行为 |
| --- | --- |
| 密码错误、用户不存在 | 返回相同外部错误，内部限流并审计 |
| Session 固定攻击 | 登录成功后销毁旧 ID 并创建新 ID |
| JWT 过期/错 issuer/错 audience | 拒绝，不自动降级为匿名高权限 |
| 用户被禁用或权限被收回 | 服务端当前状态优先于令牌旧声明 |
| CSRF Token 缺失 | Cookie 认证的状态修改请求返回 403 |

完整实践应通过框架测试客户端验证登录成功、错误密码、会话轮换、退出撤销、对象级 403、CSRF 缺失和过期令牌；测试密钥必须明显无效且与生产完全隔离。""",
    )

    replace_section(
        ROOT / "Python 常用外部库/54-Python 操作 RabbitMQ 与 Memcached 指南.md", "## 简介", "## 复习题",
        """## RabbitMQ：可靠投递而非无限重试

本文使用 Pika 1.4.1。生产者开启 publisher confirms，并声明持久化交换机/队列、持久化消息和 mandatory 路由；消费者只有在业务事务成功后才 ack。连接需 heartbeat、blocked connection timeout 和重连退避。

<!-- snippet: id=python-pika-reliable-publish mode=service python=3.12-3.14 deps=pika==1.4.1 service=rabbitmq -->
```python
import json
import os
import pika

parameters = pika.URLParameters(os.environ["AMQP_URL"])
parameters.heartbeat = 30
parameters.blocked_connection_timeout = 15
connection = pika.BlockingConnection(parameters)
try:
    channel = connection.channel()
    channel.queue_declare(queue="events", durable=True)
    channel.confirm_delivery()
    ok = channel.basic_publish(
        exchange="",
        routing_key="events",
        body=json.dumps({"event_id": "evt-test-1"}).encode(),
        properties=pika.BasicProperties(delivery_mode=pika.DeliveryMode.Persistent,
                                        content_type="application/json"),
        mandatory=True,
    )
    if not ok:
        raise RuntimeError("broker did not confirm message")
finally:
    connection.close()
```

消费者要限制 prefetch，校验消息大小/schema，并以 `event_id` 做数据库幂等。不可恢复错误进入死信队列；临时错误按有限次数和退避重试，禁止立即 requeue 形成热循环。关闭时停止拉取、等待在途任务、ack/nack 后关闭 channel 与 connection。

## Memcached：只存可丢失缓存

Memcached 没有可靠持久化和细粒度安全边界，只放可重建数据。键包含 schema 版本和租户边界，值限制大小并设置 TTL；缓存未命中、超时和节点驱逐都回源。不要存 Session 主副本、支付状态、锁或唯一幂等记录，也不要暴露到公网。

并发更新可使用 CAS 降低覆盖，但 CAS 失败必须重新读取并限制重试。反序列化只使用 JSON 等安全格式，不从缓存加载 pickle。测试需覆盖节点不可用、超时、缓存击穿、脏数据和优雅降级。""",
    )

    replace_section(
        ROOT / "设计模式/接口幂等性设计与实现方案.md", "## 概述", "## 复习题",
        """## 幂等性的真正边界

幂等不是“先查询、再决定是否写入”，因为两个并发请求能同时查询到不存在。可靠实现依赖原子边界：数据库唯一约束/条件更新，或带所有权令牌与过期时间的原子存储操作。

<!-- snippet: id=idempotency-state-machine mode=run python=3.12-3.14 deps=stdlib -->
```python
from dataclasses import dataclass, field

@dataclass
class IdempotencyStore:
    responses: dict[str, tuple[str, dict]] = field(default_factory=dict)

    def execute(self, key: str, request_hash: str, operation):
        existing = self.responses.get(key)
        if existing:
            old_hash, response = existing
            if old_hash != request_hash:
                raise ValueError("idempotency key reused with different request")
            return response
        response = operation()
        self.responses[key] = (request_hash, response)
        return response

store = IdempotencyStore()
calls = 0
def create_order():
    global calls
    calls += 1
    return {"order_id": "order-1"}

assert store.execute("key-1", "sha256:request-a", create_order) == {"order_id": "order-1"}
assert store.execute("key-1", "sha256:request-a", create_order) == {"order_id": "order-1"}
assert calls == 1
```

上例只说明状态机，线程间并不安全。生产数据库表对 `(scope, idempotency_key)` 建唯一约束，并保存请求摘要、`PROCESSING/SUCCEEDED/FAILED` 状态、响应摘要和过期时间。插入幂等记录与业务写入处于同一事务；唯一冲突后读取已有状态。相同 key 携带不同请求摘要必须返回冲突，不能复用旧响应。

跨系统调用采用 outbox/inbox：本地事务写业务数据与 outbox，后台可靠发布；消费者以事件 ID 唯一约束去重。不要用无所有权的 `SETNX` 后直接删除锁；若使用 Redis，释放时必须用 Lua 比较随机 token 后删除，并为业务超时、锁 TTL 和续租失败制定恢复策略。

测试至少制造两个并发请求、业务事务回滚、进程在处理中崩溃、重复消息、乱序消息、key 复用不同正文和缓存/数据库短暂不可用。""",
    )

    print("modernized core P0 sections")


if __name__ == "__main__":
    main()
