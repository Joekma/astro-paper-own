"""Mechanical removal of legacy-only prose and install commands."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).parents[1] / "src/data/blog/Python"


def replace_between(text: str, start: str, end: str, body: str) -> str:
    pattern = rf"(?ms)^{re.escape(start)}\s*$.*?(?=^{re.escape(end)}\s*$)"
    return re.sub(pattern, body.rstrip() + "\n\n", text, count=1)


def main() -> None:
    for path in ROOT.rglob("*.md"):
        text = path.read_text(encoding="utf-8")
        text = text.replace("pip3 install ", "python -m pip install ")
        text = text.replace("pip install ", "python -m pip install ")
        # Avoid duplicating the prefix when a previous replacement already produced it.
        text = text.replace("python -m python -m pip install ", "python -m pip install ")
        text = re.sub(r"(<!-- snippet:.*?-->\n)```\n", r"\1```text\n", text)
        # Remote hotlinks are brittle and may leak reader metadata. Every article now
        # has an accessible text flow in its core model, so remove legacy hotlinks.
        text = re.sub(r"(?m)^!\[[^]]*\]\(https?://[^\n]+\)\s*\n?", "", text)
        if re.search(r"(?m)^modDatetime:", text):
            text = re.sub(
                r"(?m)^modDatetime:.*$",
                "modDatetime: 2026-07-11T00:00:00.000+08:00",
                text,
                count=1,
            )
        else:
            text = re.sub(
                r"(?m)^(pubDatetime:.*)$",
                r"\1\nmodDatetime: 2026-07-11T00:00:00.000+08:00",
                text,
                count=1,
            )
        path.write_text(text, encoding="utf-8", newline="\n")

    path = ROOT / "Python 基础/02-Python 输入输出与基本运算符.md"
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"(?ms)^### Python 2 与 Python 3 的区别\s*$.*?(?=^## 基本运算符\s*$)",
        """### 输入转换与失败路径

Python 3.12–3.14 的 `input()` 始终返回字符串。需要数值时显式转换，并捕获转换失败；不要执行用户输入。

<!-- snippet: id=python-input-validated-conversion mode=run python=3.12-3.14 deps=stdlib -->
```python
raw = "18"
try:
    age = int(raw)
except ValueError as exc:
    raise ValueError("age must be an integer") from exc
assert age == 18
```

""",
        text,
        count=1,
    )
    path.write_text(text, encoding="utf-8", newline="\n")

    path = ROOT / "Python 基础/06-Python 字符编码与文件处理：UTF 8、Unicode、文件操作.md"
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r"(?ms)^### 重点理论\s*$.*?(?=^### 字符编码的发展历程\s*$)",
        """### Python 3 的文本模型

`str` 保存 Unicode 文本，`bytes` 保存原始字节。编码是 `str.encode(encoding)`，解码是 `bytes.decode(encoding)`；两端必须约定同一编码，文件与网络边界通常使用 UTF-8。

<!-- snippet: id=python-unicode-roundtrip mode=run python=3.12-3.14 deps=stdlib -->
```python
text = "中文与 Python"
payload = text.encode("utf-8")
assert isinstance(payload, bytes)
assert payload.decode("utf-8") == text
```

源码默认 UTF-8。打开文本文件仍应显式写 `encoding="utf-8"`，并根据数据协议选择严格报错或明确的错误处理策略。

""",
        text,
        count=1,
    )
    path.write_text(text, encoding="utf-8", newline="\n")

    path = ROOT / "Python 常用外部库/45-Python Celery 详解.md"
    text = path.read_text(encoding="utf-8")
    text = replace_between(
        text, "## 版本支持情况", "## 使用场景",
        """## 版本基线

本文锁定 Celery 5.6.3，并以 Python 3.12–3.14 为验证范围。Broker、结果后端及其客户端还需分别锁定版本；升级时先检查任务序列化、重试语义和 worker 滚动发布兼容性。""",
    )
    path.write_text(text, encoding="utf-8", newline="\n")

    replacements = {
        ROOT / "Django/06-Django 深入理解 WSGI 协议.md": {
            "距离上一篇这个系列的文章已经是半年前了，随着Django 2.0的发布，感觉之前分析的1.10.5版本似乎有点老了，好在和前面文章分析的内容差异不大，基本上也是可以就着前面的分析内容来品尝最新的django代码。":
            "本文以 Django 6.0.7 的公开 WSGI 入口为基线；源码内部结构可能在补丁版本间变化，引用内部调用链时会明确标注而不把它当作稳定 API。",
        },
        ROOT / "Django/21-Django+nginx+uwsgi部署教程（centos7+ubuntu16.4）.md": {
            "> 维护提示：CentOS 7、Ubuntu 16.04 和 Python 3.6 都已属于历史环境。本文保留为旧服务器迁移参考；新项目建议使用受支持的 Linux 发行版、Python 3.12+、Django 5.2 LTS/6.x，并优先考虑 Gunicorn 或 ASGI 服务器配合 Nginx 部署。\n": "",
        },
        ROOT / "Django/10-Django 中间件组件详解.md": {
            "MIDDLEWARE_CLASSES": "MIDDLEWARE",
        },
        ROOT / "Python 基础/13-Python 常用模块：time、datetime、random、os、sys.md": {
            "print(sys.maxint)  # 最大 int 值（Python 2）": "print(sys.maxsize)  # 平台指针大小对应的实用上限；Python int 本身可任意精度",
        },
        ROOT / "Python 常用外部库/48-Python Pillow 详解.md": {
            "由于PIL仅支持到Python 2.7，加上年久失修，于是一群志愿者在PIL的基础上创建了兼容的版本，名字叫**Pillow**，支持最新Python 3.x，又加入了许多新特性，因此，我们可以直接安装使用Pillow。":
            "Pillow 是当前维护的 Python 图像处理库，本文锁定 12.3.0。处理外部图片前先限制文件大小和像素数，并把解码失败视为不可信输入错误。",
        },
    }
    for target, mapping in replacements.items():
        text = target.read_text(encoding="utf-8")
        for old, new in mapping.items():
            text = text.replace(old, new)
        target.write_text(text, encoding="utf-8", newline="\n")

    numpy = ROOT / "Python 常用外部库/43-Python NumPy 详解.md"
    text = numpy.read_text(encoding="utf-8").replace("title: Pytghon NumPy 详解", "title: Python NumPy 详解")
    numpy.write_text(text, encoding="utf-8", newline="\n")

    search = ROOT / "Python 常用外部库/46-Python Haystack 全文搜索框架详解.md"
    text = search.read_text(encoding="utf-8")
    text = text.replace("title: Python Haystack 详解", "title: Django 6 + PostgreSQL 全文搜索实践")
    text = re.sub(
        r"(?m)^description:.*$",
        "description: 使用 Django 6.0.7 与 PostgreSQL 原生全文搜索构建可排序、可索引、可测试的站内搜索。",
        text,
        count=1,
    )
    text = replace_between(
        text, "## Introduction", "## 复习题",
        """## 为什么直接使用 PostgreSQL 全文搜索

旧版 Haystack/Whoosh 多后端教程已经移出主线。对于已经使用 PostgreSQL 的 Django 应用，`django.contrib.postgres.search` 提供公开、受维护的 `SearchVector`、`SearchQuery`、`SearchRank` 与 `SearchHeadline`，减少额外索引服务和同步链路。数据规模、语言分词或高亮需求超出 PostgreSQL 能力时，再评估专用搜索服务。

## 模型与查询

<!-- snippet: id=django-postgres-search-model mode=project python=3.12-3.14 deps=Django==6.0.7 service=postgresql file=articles/models.py -->
```python
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    published_at = models.DateTimeField(db_index=True)
```

<!-- snippet: id=django-postgres-search-query mode=project python=3.12-3.14 deps=Django==6.0.7 service=postgresql file=articles/search.py -->
```python
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

from .models import Article

def search_articles(term: str):
    term = term.strip()
    if not 1 <= len(term) <= 100:
        return Article.objects.none()
    vector = SearchVector("title", weight="A") + SearchVector("body", weight="B")
    query = SearchQuery(term, search_type="websearch")
    return (
        Article.objects.annotate(rank=SearchRank(vector, query))
        .filter(rank__gte=0.05)
        .order_by("-rank", "-published_at")[:50]
    )
```

用户查询仍然要限制长度、请求频率和返回条数。`SearchQuery` 负责把值参数化，不要把用户输入拼进 `RawSQL`。中文等语言需要确认 PostgreSQL 配置与分词扩展是否满足需求，不能假设默认 `english` 配置适用于所有文本。

## 持久搜索向量与 GIN 索引

查询量增大后，可增加 `SearchVectorField`，用迁移建立 GIN 索引，并在写入路径同步更新向量。索引表达式、语言配置和查询配置必须一致，否则数据库可能无法使用索引。

<!-- snippet: id=django-postgres-search-index mode=project python=3.12-3.14 deps=Django==6.0.7 service=postgresql file=articles/models.py -->
```python
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    search_vector = SearchVectorField(null=True)

    class Meta:
        indexes = [GinIndex(fields=["search_vector"], name="article_search_gin")]
```

完整实践使用 PostgreSQL 测试容器：运行迁移，插入固定文档，断言标题权重大于正文、空查询返回空集、超长查询被拒绝、结果最多 50 条，并用 `QuerySet.explain()` 确认足够数据量下使用 GIN 索引。测试结束删除容器卷，避免把测试索引混入本地开发数据库。""",
    )
    search.write_text(text, encoding="utf-8", newline="\n")

    print("removed legacy-only sections and normalized install commands")


if __name__ == "__main__":
    main()
