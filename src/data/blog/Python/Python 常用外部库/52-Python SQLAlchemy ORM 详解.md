---
title: Python SQLAlchemy ORM 详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-sqlalchemy-orm
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - SQLAlchemy
  - ORM
  - docs
description: SQLAlchemy ORM 框架完全指南，涵盖数据库连接、一对多/多对多关系、增删查改等核心功能。

series: python
seriesOrder: 52
language: zh-CN
---

# Python SQLAlchemy ORM 详解

## SQLAlchemy 2.0 typed declarative

本文锁定 SQLAlchemy 2.0.51。2.0 风格以 `DeclarativeBase`、`Mapped`、`mapped_column()`、`select()` 和显式事务为主，不再使用 `Query.get()`、隐式 autocommit 或字符串形式的裸 SQL。

<!-- snippet: id=python-sqlalchemy-typed-model mode=compile python=3.12-3.14 deps=SQLAlchemy==2.0.51 -->
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

关系加载默认要警惕 N+1。列表页根据访问方式选择 `selectinload()` 或 `joinedload()`，并用测试断言查询次数。执行文本 SQL 必须用 `text()` 和参数字典；动态标识符仍然只能来自白名单。
