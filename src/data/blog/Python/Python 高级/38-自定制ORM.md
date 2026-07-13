---
title: 自定制ORM
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: custom-orm-implementation
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - 数据库
  - docs
description: 自定制ORM实现指南，从零开始构建ORM框架，掌握元类、描述符与数据模型的核心原理。
series: python
seriesOrder: 38
language: zh-CN
---

# 自定制ORM

## 教学版表达式编译器

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

生产项目应使用 SQLAlchemy 2.0 等成熟实现。本示例的正确终点是理解抽象边界，而不是继续扩展成缺少安全审计的数据库框架。
