---
title: 自定制ORM
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
slug: custom-orm-implementation
modDatetime: 2026-04-22T00:00:00Z
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

## 前言

1. 我在实例化一个user对象的时候，可以 `user = User(name='lqz', password='123')`

2. 也可以 `user = User()`
   ```python
   user['name'] = 'lqz'
   user['password'] = '123'
   ```

3. 也可以 `user = User()`
   ```python
   user.name = 'lqz'
   user.password = 'password'
   ```

前两种，可以通过继承字典dict来实现，第三种，用getattr和setattr

- `__getattr__` 拦截点号运算。当对未定义的属性名称和实例进行点号运算时，就会用属性名作为字符串调用这个方法。如果继承树可以找到该属性，则不调用此方法
- `__setattr__` 会拦截所有属性的赋值语句。如果定义了这个方法，`self.attr = value` 就会变成 `self.__setattr__("attr", value)`。这个需要注意。当在 `__setattr__` 方法内对属性进行赋值是，不可使用 `self.attr = value`，因为他会再次调用 `self.__setattr__("attr", value)`，则会形成无穷递归循环，最后导致堆栈溢出异常。应该通过对属性字典做索引运算来赋值任何实例属性，也就是使用 `self.__dict__['name'] = value`

## 定义Model基类

```python
class Model(dict):
    def __init__(self, **kw):
        super(Model, self).__init__(**kw)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError('没有属性：%s' % key)

    def __setattr__(self, key, value):
        self[key] = value
```

## 定义Field

数据库中每一列数据，都有：列名，列的数据类型，是否是主键，默认值。

```python
class Field:
    def __init__(self, name, column_type, primary_key, default_value):
        self.name = name
        self.column_type = column_type
        self.primary_key = primary_key
        self.default_value = default_value

class StringField(Field):
    def __init__(self, name, column_type='varchar(100)', primary_key=False, default_value=None):
        super().__init__(name, column_type, primary_key, default_value)

class IntegerField(Field):
    def __init__(self, name, primary_key=False, default_value=0):
        super().__init__(name, 'int', primary_key, default_value)
```

## 定义元类

数据库中的每个表，都有表名，每一列的列名，以及主键是哪一列。

既然要用数据库中的表，对应着一个程序中的类，那么这个类也应该有这些类属性。

但是不同的类这些类属性又不尽相同，所以我应该怎么做？在元类里拦截类的创建过程，然后把这些东西取出来，放到类里面。

所以用到了元类。

```python
class ModelMetaclass(type):
    def __new__(cls, name, bases, attrs):
        if name == 'Model':
            return type.__new__(cls, name, bases, attrs)

        table_name = attrs.get('table_name', None)
        if not table_name:
            table_name = name

        primary_key = None
        mappings = dict()

        for k, v in attrs.items():
            if isinstance(v, Field):
                mappings[k] = v
                if v.primary_key:
                    # 找到主键
                    if primary_key:
                        raise TypeError('主键重复：%s' % k)
                    primary_key = k

        for k in mappings.keys():
            attrs.pop(k)

        if not primary_key:
            raise TypeError('没有主键')

        attrs['table_name'] = table_name
        attrs['primary_key'] = primary_key
        attrs['mappings'] = mappings

        return type.__new__(cls, name, bases, attrs)
```

## 继续Model基类

Model类是所有要对应数据库表类的基类，所以Model的元类应该是上面写的那个，而每个数据库表对应类的对象，都应该有查询、插入、保存方法。

```python
class Model(dict, metaclass=ModelMetaclass):
    def __init__(self, **kw):
        super(Model, self).__init__(**kw)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError('没有属性：%s' % key)

    def __setattr__(self, key, value):
        self[key] = value

    @classmethod
    def select_all(cls, **kwargs):
        ms = mysql_singleton.Mysql().singleton()
        if kwargs:
            key = list(kwargs.keys())[0]
            value = kwargs[key]
            sql = "select * from %s where %s=?" % (cls.table_name, key)
            sql = sql.replace('?', '%s')
            re = ms.select(sql, value)
        else:
            sql = "select * from %s" % cls.table_name
            re = ms.select(sql)
        return [cls(**r) for r in re]

    @classmethod
    def select_one(cls, **kwargs):
        key = list(kwargs.keys())[0]
        value = kwargs[key]
        ms = mysql_singleton.Mysql().singleton()
        sql = "select * from %s where %s=?" % (cls.table_name, key)
        sql = sql.replace('?', '%s')
        re = ms.select(sql, value)
        if re:
            return cls(**re[0])
        else:
            return None

    def save(self):
        ms = mysql_singleton.Mysql().singleton()
        fields = []
        params = []
        args = []
        for k, v in self.mappings.items():
            fields.append(v.name)
            params.append('?')
            args.append(getattr(self, k, v.default))
        sql = "insert into %s (%s) values (%s)" % (self.table_name, ','.join(fields), ','.join(params))
        sql = sql.replace('?', '%s')
        ms.execute(sql, args)

    def update(self):
        ms = mysql_singleton.Mysql().singleton()
        fields = []
        args = []
        pr = None
        for k, v in self.mappings.items():
            if v.primary_key:
                pr = getattr(self, k, v.default)
            else:
                fields.append(v.name + '=?')
                args.append(getattr(self, k, v.default))
        sql = "update %s set %s where %s = %s" % (
            self.table_name, ', '.join(fields), self.primary_key, pr)
        sql = sql.replace('?', '%s')
        print(sql)
        ms.execute(sql, args)
```

## 基于pymysql的数据库操作类（单例）

```python
from conf import setting
import pymysql

class Mysql:
    __instance = None

    def __init__(self):
        self.conn = pymysql.connect(
            host=setting.host,
            user=setting.user,
            password=setting.password,
            database=setting.database,
            charset=setting.charset,
            autocommit=setting.autocommit
        )
        self.cursor = self.conn.cursor(cursor=pymysql.cursors.DictCursor)

    def close_db(self):
        self.conn.close()

    def select(self, sql, args=None):
        self.cursor.execute(sql, args)
        rs = self.cursor.fetchall()
        return rs

    def execute(self, sql, args):
        try:
            self.cursor.execute(sql, args)
            affected = self.cursor.rowcount
        except BaseException as e:
            print(e)
        return affected

    @classmethod
    def singleton(cls):
        if not cls.__instance:
            cls.__instance = cls()
        return cls.__instance
```

## 数据库连接池版的数据库操作类

在此之前，要先学习数据库连接池。

### db_pool.py

```python
import pymysql
from conf import setting
from DBUtils.PooledDB import PooledDB

POOL = PooledDB(
    creator=pymysql,
    maxconnections=6,
    mincached=6,
    maxcached=5,
    maxshared=3,
    blocking=True,
    maxusage=None,
    setsession=[],
    ping=0,
    host=setting.host,
    port=setting.port,
    user=setting.user,
    password=setting.password,
    database=setting.database,
    charset=setting.charset,
    autocommit=setting.autocommit
)
```

### mysql_pool.py

```python
import pymysql
from ormpool import db_pool
from threading import current_thread

class MysqlPool:
    def __init__(self):
        self.conn = db_pool.POOL.connection()
        self.cursor = self.conn.cursor(cursor=pymysql.cursors.DictCursor)

    def close_db(self):
        self.cursor.close()
        self.conn.close()

    def select(self, sql, args=None):
        self.cursor.execute(sql, args)
        rs = self.cursor.fetchall()
        return rs

    def execute(self, sql, args):
        try:
            self.cursor.execute(sql, args)
            affected = self.cursor.rowcount
        except BaseException as e:
            print(e)
        finally:
            self.close_db()
        return affected
```

### setting.py

```python
host = '127.0.0.1'
port = 3306
user = 'root'
password = '123456'
database = 'youku2'
charset = 'utf8'
autocommit = True
```

## ORM框架完整示例

### 完整代码

```python
# -*- coding:utf-8 -*-

class Field(object):
    def __init__(self, name, column_type):
        self.name = name
        self.column_type = column_type

    def __str__(self):
        return '<%s:%s>' % (self.__class__.__name__, self.name)

class StringField(Field):
    def __init__(self, name):
        super(StringField, self).__init__(name, 'varchar(100)')

class IntegerField(Field):
    def __init__(self, name):
        super(IntegerField, self).__init__(name, 'bigint')

class ModelMetaclass(type):
    def __new__(cls, name, bases, attrs):
        if name == 'Model':
            return type.__new__(cls, name, bases, attrs)

        print('Found model: %s' % name)
        mappings = dict()

        for k, v in attrs.items():
            if isinstance(v, Field):
                print('Found mapping: %s ==> %s' % (k, v))
                mappings[k] = v

        for k in mappings.keys():
            attrs.pop(k)

        attrs['__mappings__'] = mappings
        attrs['__table__'] = name

        return type.__new__(cls, name, bases, attrs)

class Model(dict, metaclass=ModelMetaclass):
    def __init__(self, **kw):
        super(Model, self).__init__(**kw)

    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(r"'Model' object has no attribute '%s'" % key)

    def __setattr__(self, key, value):
        self[key] = value

    def save(self):
        fields = []
        params = []
        args = []
        for k, v in self.__mappings__.items():
            fields.append(v.name)
            params.append('?')
            args.append(getattr(self, k, None))
        sql = 'insert into %s (%s) values (%s)' % (
            self.__table__,
            ','.join(fields),
            ','.join(params)
        )
        print('SQL: %s' % sql)
        print('ARGS: %s' % str(args))

# 定义User类
class User(Model):
    id = IntegerField('id')
    name = StringField('username')
    email = StringField('email')
    password = StringField('password')

# 测试
if __name__ == '__main__':
    u = User(id=12345, name='Michael', email='test@orm.org', password='my-pwd')
    u.save()
```

### 运行结果

```
Found model: User
Found mapping: name ==> <StringField:username>
Found mapping: email ==> <StringField:email>
Found mapping: password ==> <StringField:password>
Found mapping: id ==> <IntegerField:id>
SQL: insert into User (password, email, name, id) values (?, ?, ?, ?)
ARGS: ['my-pwd', 'test@orm.org', 'Michael', 12345]
```

## 总结

1. **ORM的核心**：用类和类属性描述表和字段，用实例描述表记录，用方法（如save）操作数据库。

2. **元类的作用**：在类创建时自动收集字段、处理Meta信息、生成映射关系，极大简化开发者的工作。

3. **元类的工作原理**：
   - 元类是类的类，可以在类创建时拦截并修改类的创建过程
   - 通过检查类属性中的Field子类，自动收集字段信息
   - 将字段信息从类属性移到特殊的字典中（`__mappings__`）
   - 自动推断表名（默认使用类名）

4. **Model基类的设计**：
   - 继承dict可以通过字典语法访问属性
   - 实现`__getattr__`和`__setattr__`支持点号语法访问属性
   - 提供save、update等方法自动生成SQL语句
