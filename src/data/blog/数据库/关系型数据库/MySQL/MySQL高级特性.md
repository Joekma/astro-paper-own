---
title: MySQL高级特性
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-advanced-features
featured: false
draft: false
series: mysql
tags:
  - MySQL
  - 数据库
  - 视图
  - 触发器
  - 事务
description: "MySQL视图、触发器、事务、存储过程和函数的使用方法"
---

> MySQL 高级特性包括视图、触发器、事务、存储过程等。

## 视图

### 创建视图

```sql
CREATE VIEW user_view AS
SELECT id, name, email
FROM users
WHERE status = 'active';

-- 使用视图
SELECT * FROM user_view;
```

### 修改/删除视图

```sql
ALTER VIEW user_view AS
SELECT id, name, email, created_at
FROM users;

DROP VIEW IF EXISTS user_view;
```

## 触发器

### 创建触发器

```sql
DELIMITER $$

CREATE TRIGGER before_insert_user
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    SET NEW.created_at = NOW();
END$$

DELIMITER ;
```

### 查看/删除触发器

```sql
SHOW TRIGGERS;
DROP TRIGGER before_insert_user;
```

## 事务

### 基本操作

```sql
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;  -- 提交
-- ROLLBACK;  -- 回滚
```

### 事务隔离级别

```sql
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

| 级别             | 说明       |
| ---------------- | ---------- |
| READ UNCOMMITTED | 脏读       |
| READ COMMITTED   | 不可重复读 |
| REPEATABLE READ  | 可重复读   |
| SERIALIZABLE     | 串行化     |

## 存储过程

### 创建存储过程

```sql
DELIMITER $$

CREATE PROCEDURE get_user_count()
BEGIN
    SELECT COUNT(*) AS total FROM users;
END$$

DELIMITER ;

-- 调用
CALL get_user_count();
```

### 带参数的存储过程

```sql
DELIMITER $$

CREATE PROCEDURE get_user_by_id(IN user_id INT)
BEGIN
    SELECT * FROM users WHERE id = user_id;
END$$

DELIMITER ;

CALL get_user_by_id(1);
```

## 函数

### 创建函数

```sql
DELIMITER $$

CREATE FUNCTION get_user_name(uid INT)
RETURNS VARCHAR(100)
BEGIN
    DECLARE result VARCHAR(100);
    SELECT name INTO result FROM users WHERE id = uid;
    RETURN result;
END$$

DELIMITER ;

-- 使用
SELECT get_user_name(1);
```

## 流程控制

```sql
-- IF 语句
IF condition THEN
    -- statements
ELSEIF condition THEN
    -- statements
ELSE
    -- statements
END IF;

-- CASE 语句
CASE variable
    WHEN value1 THEN result1;
    WHEN value2 THEN result2;
    ELSE result3;
END CASE;

-- 循环
WHILE condition DO
    -- statements
END WHILE;
```

## 小结

- **视图**：虚拟表，简化查询
- **触发器**：自动执行的事件
- **事务**：ACID 特性的操作单元
- **存储过程**：预编译的 SQL 代码块
- **函数**：返回值的存储过程
