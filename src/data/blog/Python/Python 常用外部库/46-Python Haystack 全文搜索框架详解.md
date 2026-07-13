---
title: Django 6 + PostgreSQL 全文搜索实践
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: haystack-complete-guide-django-full-text-search-framework
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - Django
  - docs
description: 使用 Django 6.0.7 与 PostgreSQL 原生全文搜索构建可排序、可索引、可测试的站内搜索。
series: python
seriesOrder: 46
language: zh-CN
---

# Python Haystack 详解

## 为什么直接使用 PostgreSQL 全文搜索

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

完整实践使用 PostgreSQL 测试容器：运行迁移，插入固定文档，断言标题权重大于正文、空查询返回空集、超长查询被拒绝、结果最多 50 条，并用 `QuerySet.explain()` 确认足够数据量下使用 GIN 索引。测试结束删除容器卷，避免把测试索引混入本地开发数据库。
