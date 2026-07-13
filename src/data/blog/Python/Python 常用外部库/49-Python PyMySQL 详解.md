---
title: Python PyMySQL 详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-mysql-pymysql-guide
modDatetime: 2026-07-11T00:00:00.000+08:00
featured: false
draft: false
tags:
  - Python
  - MySQL
  - docs
description: PyMySQL 模块详解与 MySQL 权限管理指南。
series: python
seriesOrder: 49
language: zh-CN
---

# Python PyMySQL 详解

## PyMySQL 事务实践

本文基于 PyMySQL 1.1.2。连接信息全部来自环境变量，连接和游标使用上下文管理器；SQL 中的值只通过 `%s` 占位符绑定。占位符不加引号，驱动会按类型完成转义和传输。

<!-- snippet: id=python-pymysql-transaction mode=service python=3.12-3.14 deps=PyMySQL==1.1.2 service=mysql -->
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

批量写入使用 `executemany()`，大结果集分批读取；事务只包围一个业务原子操作。捕获异常后必须回滚并继续抛出，不能打印后假装成功。
