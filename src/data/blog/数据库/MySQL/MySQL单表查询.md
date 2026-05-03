---
title: MySQL单表查询
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: mysql-single-table-query
featured: false
draft: false
tags:
  - MySQL
  - 数据库
  - SQL
description: 'MySQL单表查询，从基础查询到高级技巧'
---

> 单表查询是 SQL 的基础，掌握好单表查询的各种技巧能大大提高数据处理效率。

## 基础查询

### SELECT 语句

```sql
SELECT * FROM employees;

SELECT employee_id, first_name, last_name, salary
FROM employees;

SELECT first_name, last_name, salary * 12 AS annual_salary
FROM employees;
```

### DISTINCT 去重

```sql
SELECT DISTINCT department_id FROM employees;
SELECT DISTINCT job_id, department_id FROM employees;
```

### LIMIT 限制

```sql
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;
SELECT * FROM employees LIMIT 5, 10;
```

## 条件查询

### WHERE 子句

```sql
SELECT * FROM employees WHERE salary > 5000;
SELECT * FROM employees WHERE department_id = 10;
SELECT * FROM employees WHERE hire_date >= '2020-01-01';
```

### 比较运算符

| 运算符 | 说明 |
|--------|------|
| `=` | 等于 |
| `<>` 或 `!=` | 不等于 |
| `>` | 大于 |
| `<` | 小于 |
| `>=` | 大于等于 |
| `<=` | 小于等于 |

```sql
SELECT * FROM employees WHERE salary >= 5000 AND salary <= 10000;
SELECT * FROM employees WHERE salary BETWEEN 5000 AND 10000;
```

### 逻辑运算符

```sql
SELECT * FROM employees
WHERE department_id = 10 AND salary > 5000;

SELECT * FROM employees
WHERE department_id = 10 OR department_id = 20;

SELECT * FROM employees WHERE NOT department_id = 10;
```

### IN 和 NOT IN

```sql
SELECT * FROM employees
WHERE department_id IN (10, 20, 30);

SELECT * FROM employees
WHERE job_id NOT IN ('CLERK', 'SALESMAN');
```

### LIKE 模糊匹配

```sql
SELECT * FROM employees WHERE first_name LIKE 'J%';
SELECT * FROM employees WHERE first_name LIKE '_o%';
SELECT * FROM employees WHERE email LIKE '%@gmail.com';
```

### NULL 判断

```sql
SELECT * FROM employees WHERE manager_id IS NULL;
SELECT * FROM employees WHERE manager_id IS NOT NULL;
```

## 排序和分组

### ORDER BY 排序

```sql
SELECT * FROM employees ORDER BY salary;
SELECT * FROM employees ORDER BY salary ASC;
SELECT * FROM employees ORDER BY salary DESC;
SELECT * FROM employees ORDER BY department_id, salary DESC;
```

### GROUP BY 分组

```sql
SELECT department_id, COUNT(*) as emp_count
FROM employees
GROUP BY department_id;

SELECT job_id, AVG(salary) as avg_salary
FROM employees
GROUP BY job_id
HAVING AVG(salary) > 5000;
```

### 聚合函数

| 函数 | 说明 |
|------|------|
| COUNT() | 计数 |
| SUM() | 求和 |
| AVG() | 平均值 |
| MAX() | 最大值 |
| MIN() | 最小值 |

```sql
SELECT
    COUNT(*) as total,
    AVG(salary) as avg_salary,
    MAX(salary) as max_salary,
    MIN(salary) as min_salary
FROM employees;
```

## 子查询

### 标量子查询

```sql
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

SELECT * FROM employees
WHERE department_id = (SELECT department_id FROM departments WHERE department_name = 'IT');
```

### IN 子查询

```sql
SELECT * FROM employees
WHERE department_id IN (
    SELECT department_id FROM departments WHERE location_id = 1700
);
```

## 常用技巧

### 列转行

```sql
SELECT
    employee_id,
    SUM(CASE WHEN stat = 'income' THEN amount ELSE 0 END) as income,
    SUM(CASE WHEN stat = 'expense' THEN amount ELSE 0 END) as expense
FROM account_log
GROUP BY employee_id;
```

### 分页查询

```sql
SELECT * FROM employees
ORDER BY employee_id
LIMIT 10 OFFSET 20;

SELECT * FROM employees
ORDER BY employee_id
LIMIT 20, 10;
```

## 小结

- **基础查询**：SELECT、DISTINCT、LIMIT
- **条件过滤**：WHERE、比较运算符、逻辑运算符
- **排序分组**：ORDER BY、GROUP BY、HAVING
- **聚合函数**：COUNT、SUM、AVG、MAX、MIN
- **子查询**：标量子查询、IN 子查询