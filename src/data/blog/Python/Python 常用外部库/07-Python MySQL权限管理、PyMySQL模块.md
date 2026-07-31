---
title: Python MySQL权限管理、PyMySQL模块
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: python-mysql-pymysql-guide
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - MySQL
  - docs
description: PyMySQL 模块详解与 MySQL 权限管理指南。
series: Python常用外部库
seriesOrder: 7
language: zh-CN
---

# Python MySQL权限管理、PyMySQL模块

## MySQL权限管理

### 权限管理重点

MySQL 默认有个root用户，但是这个用户权限太大，一般只在管理数据库时候才用。如果在项目中要连接 MySQL 数据库，则建议新建一个权限较小的用户来连接。

在 MySQL 命令行模式下输入如下命令可以为 MySQL 创建一个新用户：

```sql
-- 创建新用户
CREATE USER "账户名"@"主机名" IDENTIFIED BY 密码;
CREATE USER "tom"@"localhost" IDENTIFIED BY "123";
```

新用户创建完成，但是此刻如果以此用户登陆的话，会报错，因为我们还没有为这个用户分配相应权限，分配权限的命令如下：

```sql
-- 授予所有数据库所有表的所有权限给jerry这个用户
-- 并允许jerry在任意一台电脑登录，如果用户不存在会自动创建
GRANT ALL ON *.* TO "jerry"@"%" IDENTIFIED BY "123" WITH GRANT OPTION;

-- WITH GRANT OPTION 这个用户可以将拥有的权限授予别人
```

授予username用户在所有数据库上的所有权限。

如果此时发现刚刚给的权限太大了，如果我们只是想授予它在某个数据库上的权限，那么需要切换到root 用户撤销刚才的权限，重新授权：

```sql
-- 授予day45数据库所有表的所有权限给jack这个用户
GRANT ALL ON day45.* TO "jack"@"%" IDENTIFIED BY "123";

-- 授予day45数据库的emp表的所有权限给rose这个用户
GRANT ALL ON day45.emp TO "rose"@"%" IDENTIFIED BY "123";

-- 授予day45数据库的emp表的name字段的查询权限给maria这个用户
GRANT SELECT(name) ON day45.emp TO "maria"@"%" IDENTIFIED BY "123";
```

另外每当调整权限后，通常需要执行以下语句刷新权限：

```sql
FLUSH PRIVILEGES;
```

收回权限：

```sql
REVOKE all privileges [column] ON db.table FROM user@"host";
```

如何授权就如何收回，因为不同权限信息存到不同的表中：

```sql
REVOKE all privileges ON day45.emp FROM maria@"%";
```

当你在云服务器部署了 mysql环境时，你的程序无法直接连接到服务器，需要授予在任意一台电脑登录的权限：

```sql
GRANT ALL ON *.* TO "jerry"@"%" IDENTIFIED BY "123" WITH GRANT OPTION;
```

删除刚才创建的用户：

```sql
DROP USER 用户名@localhost;
```

仔细上面几个命令，可以发现不管是授权，还是撤销授权，都要指定响应的host（即 @ 符号后面的内容），因为以上几个命令实际上都是在操作mysql 数据库中的user表，可以用如下命令查看相应用户及对应的host:

```sql
SELECT User, Host FROM mysql.user;
```

### 权限表

MySQL服务器通过MySQL权限表来控制用户对数据库的访问，MySQL权限表存放在mysql数据库里，由mysql_install_db脚本初始化。这些MySQL权限表分别是user、db、table_priv、columns_priv和host。下面分别介绍一下这些表的结构和内容：

| 表名 | 说明 |
|------|------|
| **user权限表** | 记录允许连接到服务器的用户帐号信息，里面的权限是全局级的 |
| **db权限表** | 记录各个帐号在各个数据库上的操作权限 |
| **table_priv权限表** | 记录数据表级的操作权限 |
| **columns_priv权限表** | 记录数据列级的操作权限 |
| **host权限表** | 配合db权限表对给定主机上数据库级操作权限作更细致的控制。这个权限表不受GRANT和REVOKE语句的影响 |

### 权限列表

| 权限 | 说明 |
|------|------|
| ALTER | 修改表和索引 |
| CREATE | 创建数据库和表 |
| DELETE | 删除表中已有的记录 |
| DROP | 抛弃(删除)数据库和表 |
| INDEX | 创建或抛弃索引 |
| INSERT | 向表中插入新行 |
| REFERENCE | 未用 |
| SELECT | 检索表中的记录 |
| UPDATE | 修改现存表记录 |
| FILE | 读或写服务器上的文件 |
| PROCESS | 查看服务器中执行的线程信息或杀死线程 |
| RELOAD | 重载授权表或清空日志、主机缓存或表缓存 |
| SHUTDOWN | 关闭服务器 |
| ALL | 所有权限，ALL PRIVILEGES同义词 |
| USAGE | 特殊的"无权限"权限 |

> 用户账户包括 "username" 和 "host" 两部分，后者表示该用户被允许从何地接入。tom@'%' 表示任何地址，默认可以省略。还可以是 "tom@192.168.1.%"、"tom@%.abc.com" 等。数据库格式为 db@table，可以是 "test.*" 或 "*.*"，前者表示 test 数据库的所有表，后者表示所有数据库的所有表。

**子句 "WITH GRANT OPTION" 表示该用户可以为其他用户分配权限。**

### 补充知识

**grant和revoke可以在几个层次上控制访问权限：**

1. 整个服务器，使用 grant ALL 和 revoke ALL
2. 整个数据库，使用 on database.*
3. 特定表，使用 on database.table
4. 特定的列
5. 特定的存储过程

**user表中host列的值的意义：**

| 值 | 说明 |
|---|------|
| % | 匹配所有主机 |
| localhost | localhost不会被解析成IP地址，直接通过UNIX socket连接 |
| 127.0.0.1 | 会通过TCP/IP协议连接，并且只能在本机访问 |
| ::1 | ::1就是兼容支持ipv6的，表示同ipv4的127.0.0.1 |

**grant 普通数据用户，查询、插入、更新、删除数据库中所有表数据的权利：**

```sql
GRANT SELECT ON testdb.* TO common_user@'%';
GRANT INSERT ON testdb.* TO common_user@'%';
GRANT UPDATE ON testdb.* TO common_user@'%';
GRANT DELETE ON testdb.* TO common_user@'%';
-- 或者，用一条 MySQL 命令来替代：
GRANT SELECT, INSERT, UPDATE, DELETE ON testdb.* TO common_user@'%';
```

**grant 数据库开发人员，创建表、索引、视图、存储过程、函数等权限：**

```sql
GRANT CREATE ON testdb.* TO developer@'192.168.0.%';
GRANT ALTER ON testdb.* TO developer@'192.168.0.%';
GRANT DROP ON testdb.* TO developer@'192.168.0.%';
GRANT REFERENCES ON testdb.* TO developer@'192.168.0.%';
GRANT CREATE TEMPORARY TABLES ON testdb.* TO developer@'192.168.0.%';
GRANT INDEX ON testdb.* TO developer@'192.168.0.%';
GRANT CREATE VIEW ON testdb.* TO developer@'192.168.0.%';
GRANT SHOW VIEW ON testdb.* TO developer@'192.168.0.%';
GRANT CREATE ROUTINE ON testdb.* TO developer@'192.168.0.%';
GRANT ALTER ROUTINE ON testdb.* TO developer@'192.168.0.%';
GRANT EXECUTE ON testdb.* TO developer@'192.168.0.%';
```

**grant 普通 DBA 管理某个 MySQL 数据库的权限：**

```sql
GRANT ALL PRIVILEGES ON testdb TO dba@'localhost';
-- 其中，关键字 "privileges" 可以省略
```

**grant 高级 DBA 管理 MySQL 中所有数据库的权限：**

```sql
GRANT ALL ON *.* TO dba@'localhost';
```

**MySQL grant 权限分别可以作用在多个层次上：**

```sql
-- 1. grant 作用在整个 MySQL 服务器上
GRANT SELECT ON *.* TO dba@localhost;  -- dba 可以查询 MySQL 中所有数据库中的表
GRANT ALL ON *.* TO dba@localhost;  -- dba 可以管理 MySQL 中的所有数据库

-- 2. grant 作用在单个数据库上
GRANT SELECT ON testdb.* TO dba@localhost;  -- dba 可以查询 testdb 中的表

-- 3. grant 作用在单个数据表上
GRANT SELECT, INSERT, UPDATE, DELETE ON testdb.orders TO dba@localhost;

-- 4. grant 作用在表中的列上
GRANT SELECT(id, se, rank) ON testdb.apache_log TO dba@localhost;

-- 5. grant 作用在存储过程、函数上
GRANT EXECUTE ON PROCEDURE testdb.pr_add TO 'dba'@'localhost';
GRANT EXECUTE ON FUNCTION testdb.fn_add TO 'dba'@'localhost';
```

> **注意**：修改完权限以后一定要刷新服务，或者重启服务，刷新服务用：`FLUSH PRIVILEGES`。

## IDE工具介绍

生产环境还是推荐使用mysql命令行，但为了方便我们测试，可以使用IDE工具，不能依赖这种IDE。

需要掌握：
1. 测试+链接数据库
2. 新建库
3. 新建表，新增字段+类型+约束
4. 设计表：外键
5. 新建查询
6. 备份库/表

> **注意**：批量加注释：`Ctrl+?` 键；批量去注释：`Ctrl+Shift+?` 键

## pymysql模块

### 安装

```bash
pip3 install pymysql
```

### 准备工作

```sql
CREATE DATABASE userinfo;
USE userinfo;
CREATE TABLE regis(name CHAR(10), password INT(10));
INSERT INTO regis VALUES('xuxu', 123456);
```

### 建立链接、执行sql、关闭（游标）

```python
import pymysql

user = input('用户名: ').strip()
pwd = input('密码: ').strip()

# 链接
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='1234',
    database='userinfo',
    charset='utf8'
)

# 游标
cursor = conn.cursor()  # 执行完毕返回的结果集默认以元组显示
# cursor = conn.cursor(cursor=pymysql.cursors.DictCursor)  # 这种以字典的形式输出的可以很直观的看到字段和记录

# 执行sql语句
sql = 'SELECT * FROM regis WHERE name="%s" AND password="%s"' % (user, pwd)
print(sql)
res = cursor.execute(sql)  # 执行sql语句，返回sql查询成功的记录数目
print(res)

cursor.close()
conn.close()

if res:
    print('登录成功')
else:
    print('登录失败')
```
执行结果：
```
用户名: xuxu
密码: 123456
SELECT * FROM regis WHERE name="xuxu" AND password="123456"
1
登录成功
```

### execute()之SQL注入

> **注意**：符号 `--` 会注释掉它之后的sql，正确的语法：`--` 后至少有一个任意字符

**根本原理**：根据程序的字符串拼接 `name='%s'`，我们输入一个 `xxx' -- haha`，用我们输入的xxx加'在程序中拼接成一个判断条件 `name='xxx' -- haha'`

最后那一个空格，在一条sql语句中如果遇到：

```sql
SELECT * FROM t1 WHERE id > 3 -- AND name='xuxu';
```

则 `--` 之后的条件被注释掉了

**SQL注入类型：**

1. **SQL注入之：用户存在，绕过密码**
   ```
   xuxu' -- 任意字符
   ```

2. **SQL注入之：用户不存在，绕过用户与密码**
   ```
   xxx' OR 1=1 -- 任意字符
   ```

**解决方案**

原来是我们对sql进行字符串拼接：

```python
sql = "SELECT * FROM userinfo WHERE name='%s' AND password='%s'" % (user, pwd)
print(sql)
res = cursor.execute(sql)
```

改写为（execute帮我们做字符串拼接，我们无需且一定不能再为%s加引号了）：

```python
# 注意：%s 需要去掉引号，因为pymysql会自动为我们加上
sql = "SELECT * FROM userinfo WHERE name=%s AND password=%s"
res = cursor.execute(sql, [user, pwd])
# pymysql模块自动帮我们解决sql注入的问题，只要我们按照pymysql的规矩来
```
### 增、删、改：conn.commit()

```python
import pymysql

# 链接
conn = pymysql.connect(host='localhost', user='root', password='123', database='egon')

# 游标
cursor = conn.cursor()

# 执行sql语句
# part1: 单条插入
sql = 'INSERT INTO userinfo(name, password) VALUES("root", "123456");'
res = cursor.execute(sql)
print(res)

# part2: 参数化插入
sql = 'INSERT INTO userinfo(name, password) VALUES(%s, %s);'
res = cursor.execute(sql, ("root", "123456"))
print(res)

# part3: 批量插入
sql = 'INSERT INTO userinfo(name, password) VALUES(%s, %s);'
res = cursor.executemany(sql, [("root", "123456"), ("lhf", "12356"), ("eee", "156")])
print(res)

conn.commit()  # 提交后才发现表中插入记录成功
cursor.close()
conn.close()
```

### 查：fetchone，fetchmany，fetchall

```python
import pymysql

# 链接
conn = pymysql.connect(host='localhost', user='root', password='123', database='egon')

# 游标
cursor = conn.cursor()

# 执行sql语句
sql = 'SELECT * FROM userinfo;'
rows = cursor.execute(sql)  # 执行sql语句，返回sql影响成功的行数rows，将结果放入一个集合，等待被查询

# cursor.scroll(3, mode='absolute')  # 相对绝对位置移动
# cursor.scroll(3, mode='relative')  # 相对当前位置移动

res1 = cursor.fetchone()
res2 = cursor.fetchone()
res3 = cursor.fetchone()
res4 = cursor.fetchmany(2)
res5 = cursor.fetchall()

print(res1)
print(res2)
print(res3)
print(res4)
print(res5)
print('%s rows in set (0.00 sec)' % rows)

conn.commit()  # 提交后才发现表中插入记录成功
cursor.close()
conn.close()
```
输出结果：
```
(1, 'root', '123456')
(2, 'root', '123456')
(3, 'root', '123456')
((4, 'root', '123456'), (5, 'root', '123456'))
((6, 'root', '123456'), (7, 'lhf', '12356'), (8, 'eee', '156'))
5 rows in set (0.00 sec)
```

### 获取插入的最后一条数据的自增ID

```python
import pymysql

conn = pymysql.connect(host='localhost', user='root', password='123', database='egon')
cursor = conn.cursor()

sql = 'INSERT INTO userinfo(name, password) VALUES("xxx", "123");'
rows = cursor.execute(sql)
print(cursor.lastrowid)  # 在插入语句后查看

conn.commit()

cursor.close()
conn.close()
```

---