---
title: Python Pydantic 详解
author: Joekma
pubDatetime: 2026-05-11T00:00:00.000+08:00
modDatetime: 2026-05-11T00:00:00.000+08:00
slug: pydantic-complete-guide
description: 'Pydantic完全指南，详细介绍数据验证、类型约束、模型定义和最佳实践。'
tags:
  - Python
  - Pydantic
  - 数据验证
  - 类型提示
draft: false
series: python
seriesOrder: 50
language: zh-CN
---

## 概述

Pydantic 是一个基于 Python 类型注解的数据验证库。它使用 Python 的类型注解系统来定义数据模型，自动进行数据验证和转换。Pydantic 在现代 Python 应用中广泛使用，尤其在 FastAPI、Django Ninja 等框架中作为核心组件。

### 为什么选择 Pydantic？

| 特性 | 说明 |
|------|------|
| **类型安全** | 基于 Python 类型注解，IDE 支持好 |
| **自动验证** | 数据自动验证，错误信息清晰 |
| **数据转换** | 自动类型转换，减少样板代码 |
| **序列化** | 内置 JSON 序列化支持 |
| **性能** | 使用 attrs 和 cython，性能优秀 |
| **生态丰富** | 与 FastAPI、Django 深度集成 |

### 安装 Pydantic

```bash
# 使用 pip 安装
pip install pydantic

# 如果需要 email 验证功能
pip install "pydantic[email]"

# 如果需要 Django 集成
pip install "pydantic[django]"

# 如果需要 YAML 支持
pip install "pydantic[yaml]"
```

## 基础模型定义

### 创建第一个模型

```python
# 导入 BaseModel 基类
from pydantic import BaseModel

# 定义一个简单的用户模型
class User(BaseModel):
    # 基础字段定义
    name: str          # 字符串类型，必填
    age: int           # 整数类型，必填
    email: str         # 邮箱，必填

# 创建用户实例
user = User(name="张三", age=25, email="zhangsan@example.com")

# 访问属性
print(user.name)    # 输出: 张三
print(user.age)     # 输出: 25

# model_dump(): 将模型实例转换为 Python 字典（dict）
# 这是 Pydantic v2 的方法名，v1 版本使用的是 dict()
user_dict = user.model_dump()
print(user_dict)
# 输出: {'name': '张三', 'age': 25, 'email': 'zhangsan@example.com'}

# model_dump_json(): 将模型实例转换为 JSON 字符串
# 等同于 json.dumps(model_dump())，内部自动处理日期等类型的序列化
user_json = user.model_dump_json()
print(user_json)
# 输出: {"name": "张三", "age": 25, "email": "zhangsan@example.com"}
```

### 字段类型

Pydantic 支持所有标准 Python 类型：

```python
from pydantic import BaseModel, Field
from typing import Any, List, Dict, Optional, Union
from datetime import datetime
from uuid import UUID

class DataTypesModel(BaseModel):
    # 基础类型
    name: str           # 字符串
    age: int            # 整数
    height: float       # 浮点数
    is_active: bool    # 布尔值

    # 可选类型
    nickname: Optional[str] = None  # 可选字符串，默认 None
    bio: Optional[str] = None       # 可选字符串

    # 容器类型
    tags: List[str] = Field(default_factory=list)   # 字符串列表
    metadata: Dict[str, Any] = Field(default_factory=dict)  # 字典类型

    # 特殊类型
    created_at: datetime = Field(default_factory=datetime.now)  # 日期时间
    user_id: UUID = UUID("12345678-1234-1234-1234-123456789012")  # UUID

# 创建实例
model = DataTypesModel(
    name="李四",
    age=30,
    height=175.5,
    is_active=True,
    tags=["python", "pydantic"],
    metadata={"level": "admin"}
)

print(model.name)
print(model.tags)
```

### 可选字段和默认值

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class Employee(BaseModel):
    # 必填字段：没有默认值
    employee_id: int
    name: str

    # 可选字段：使用 Optional 或默认值
    department: Optional[str] = None  # None 作为默认值
    salary: float = 0.0               # 0.0 作为默认值

    # 使用 Field 自定义默认值
    hire_date: Optional[date] = Field(default=None, description="入职日期")

    # 带有默认值列表
    skills: List[str] = Field(default_factory=list, description="技能列表")

    # 带有默认值字典
    contact_info: Dict[str, str] = Field(default_factory=dict)

# 创建实例 - 部分字段
emp = Employee(
    employee_id=1001,
    name="王五"
)

# 使用默认值
print(emp.department)     # 输出: None
print(emp.salary)         # 输出: 0.0
print(emp.skills)         # 输出: []

# 覆盖默认值
emp_full = Employee(
    employee_id=1002,
    name="赵六",
    department="技术部",
    salary=15000.0,
    skills=["Python", "FastAPI"]
)

print(emp_full.skills)
```

## 字段验证器

### Field 验证器

使用 Field 函数添加验证约束：

```python
from pydantic import BaseModel, Field, field_validator
from typing import List

class Product(BaseModel):
    # 字符串长度限制
    name: str = Field(
        min_length=2,       # 最小长度
        max_length=100,      # 最大长度
        description="产品名称"
    )

    # 数值范围限制
    price: float = Field(
        gt=0,               # 大于 0
        le=1000000,         # 小于等于 1000000
        description="产品价格"
    )

    # 整数范围限制
    quantity: int = Field(
        ge=0,               # 大于等于 0
        le=10000,          # 小于等于 10000
        default=0          # 默认值
    )

    # 字符串正则表达式
    product_code: str = Field(
        pattern=r"^[A-Z]{3}-\d{4}$",  # 格式: ABC-1234
        description="产品代码"
    )

    # 列表长度限制
    images: List[str] = Field(
        min_length=1,       # 至少 1 张图片
        max_length=10,       # 最多 10 张图片
        default_factory=list
    )

# 创建有效产品
product = Product(
    name="iPhone",
    price=6999.0,
    quantity=100,
    product_code="APL-2024",
    images=["image1.jpg", "image2.jpg"]
)

print(product.name)

# 无效产品会抛出验证错误
try:
    invalid_product = Product(
        name="A",              # 太短
        price=-100,             # 小于 0
        product_code="INVALID"  # 不匹配正则
    )
except Exception as e:
    print(f"验证错误: {e}")
```

### 字段别名

```python
from pydantic import BaseModel, Field, AliasChoices

class UserModel(BaseModel):
    # Field 参数说明：
    # - alias: 序列化时使用的别名（导出时显示的名称）
    # - validation_alias: 验证时接受的别名（允许传入的多个名称）
    # - AliasChoices: 允许验证时接受多个不同的别名名称
    user_name: str = Field(alias="userName", validation_alias=AliasChoices("userName", "username", "name"))

    # 多个别名：验证时接受 email、emailAddress、mail 任一参数
    email_address: str = Field(alias="email", validation_alias=AliasChoices("email", "emailAddress", "mail"))

    # alias 和 serialization_alias 的区别：
    # - alias: 输入和输出都使用该别名
    # - serialization_alias: 仅输出时使用该别名
    phone: str = Field(alias="phoneNumber", serialization_alias="phone_number")

# 使用别名创建实例
user = UserModel(
    userName="zhangsan",
    email="zhangsan@example.com",
    phoneNumber="13800138000"
)

# 访问字段（使用原始名称）
print(user.user_name)

# 导出时使用别名
user_dict = user.model_dump(by_alias=True)
print(user_dict)
# 输出: {'userName': 'zhangsan', 'email': 'zhangsan@example.com', 'phone_number': '13800138000'}
```

## 数据验证器

### 字段验证器

使用 @field_validator 装饰器验证单个字段：

```python
from pydantic import BaseModel, field_validator

class RegisterForm(BaseModel):
    username: str
    password: str
    email: str
    age: int

    # @field_validator 装饰器说明：
    # - 参数 "username" 指定要验证的字段名，可以是单个字段或多个字段的列表
    # - 必须使用 @classmethod，因为验证器是类方法
    # - info 参数（可选）包含字段的额外信息，如 field_name、data（其他字段值）
    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        # 检查用户名长度
        if len(v) < 3:
            raise ValueError("用户名至少需要3个字符")

        # 检查是否只包含字母数字
        if not v.isalnum():
            raise ValueError("用户名只能包含字母和数字")

        return v.lower()  # 转换为小写

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        # 检查密码长度
        if len(v) < 8:
            raise ValueError("密码至少需要8个字符")

        # 检查是否包含数字
        if not any(c.isdigit() for c in v):
            raise ValueError("密码必须包含至少一个数字")

        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        # 检查是否包含 @
        if "@" not in v:
            raise ValueError("邮箱格式不正确")

        return v.lower()  # 转换为小写

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        # 检查年龄范围
        if v < 0 or v > 150:
            raise ValueError("年龄必须在 0-150 之间")

        return v

# 测试验证
form = RegisterForm(
    username="ZhangSan",
    password="password123",
    email="ZHANGSAN@Example.com",
    age=25
)

print(f"用户名: {form.username}")  # 输出: zhangsan（小写）
print(f"邮箱: {form.email}")      # 输出: zhangsan@example.com（小写）
```

### 模型验证器

使用 @model_validator 验证多个字段之间的关系：

```python
from pydantic import BaseModel, model_validator
from typing import Self

class OrderModel(BaseModel):
    order_id: str
    start_date: str
    end_date: str
    status: str

    # @model_validator 装饰器说明：
    # - mode="after": 在所有字段验证完成后执行，适用于需要访问多个字段的场景
    # - 返回值类型必须标注为 Self（Python 3.11+）或具体类型名
    # - self 参数包含所有已验证的字段值
    @model_validator(mode="after")
    def validate_dates(self) -> Self:
        # 检查日期顺序
        if self.start_date > self.end_date:
            raise ValueError("结束日期必须在开始日期之后")

        # 检查订单状态与日期的逻辑关系
        if self.status == "completed" and self.end_date > "2024-12-31":
            raise ValueError("已完成订单的结束日期不能超过2024年")

        return self

# 有效的订单
order = OrderModel(
    order_id="ORD001",
    start_date="2024-01-01",
    end_date="2024-12-31",
    status="ongoing"
)

print(f"订单ID: {order.order_id}")

# 无效的订单
try:
    invalid_order = OrderModel(
        order_id="ORD002",
        start_date="2024-12-31",
        end_date="2024-01-01",  # 结束日期在开始日期之前
        status="completed"
    )
except ValueError as e:
    print(f"验证错误: {e}")
```

### 跨字段验证

```python
from pydantic import BaseModel, model_validator, ValidationError
from typing import Optional, Self

class SubscriptionModel(BaseModel):
    plan: str
    monthly_price: float
    yearly_price: float
    discount_code: Optional[str] = None

    # model_validator 也可以用于定价逻辑验证
    # 当 plan 为 "yearly" 时，验证年付价格是否合理
    @model_validator(mode="after")
    def validate_pricing(self) -> Self:
        # 计算折扣
        if self.plan == "yearly":
            # 年付应该有折扣
            expected_yearly = self.monthly_price * 12 * 0.8  # 8折
            if self.yearly_price > expected_yearly * 1.1:  # 允许10%误差
                raise ValueError(
                    f"年付价格过高，应低于 {expected_yearly:.2f}"
                )

        # 检查折扣码
        if self.plan in ["yearly", "premium"] and not self.discount_code:
            raise ValueError("年付和高级套餐需要折扣码")

        return self

# 有效订阅
sub = SubscriptionModel(
    plan="yearly",
    monthly_price=100.0,
    yearly_price=960.0,  # 100 * 12 * 0.8 = 960
    discount_code="SAVE20"
)

# 无效订阅
try:
    invalid_sub = SubscriptionModel(
        plan="yearly",
        monthly_price=100.0,
        yearly_price=1200.0,  # 年付价格太高
        discount_code="SAVE20"
    )
except ValidationError as e:
    print(f"验证错误: {e}")
```

## 嵌套模型

### 定义嵌套模型

```python
from pydantic import BaseModel, Field
from typing import List, Optional

# 基础模型：地址
class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "中国"

# 基础模型：技能
class Skill(BaseModel):
    name: str
    level: str  # 初级、中级、高级、专家

# 嵌套模型：员工
class Employee(BaseModel):
    # 普通字段
    employee_id: str
    name: str
    department: str

    # 嵌套模型字段
    address: Address

    # 嵌套模型列表
    skills: List[Skill] = Field(default_factory=list)

    # 可选的嵌套模型
    manager: Optional["Employee"] = None

# 创建员工实例
employee = Employee(
    employee_id="E001",
    name="张三",
    department="技术部",
    address=Address(
        street="科技路123号",
        city="北京",
        state="北京市",
        zip_code="100000"
    ),
    skills=[
        Skill(name="Python", level="高级"),
        Skill(name="FastAPI", level="中级")
    ]
)

# 访问嵌套字段
print(f"员工姓名: {employee.name}")
print(f"城市: {employee.address.city}")
print(f"第一个技能: {employee.skills[0].name}")
```

### 自引用模型

```python
from __future__ import annotations

from pydantic import BaseModel, Field

class EmployeeWithRef(BaseModel):
    employee_id: str
    name: str

    # 自引用字段
    supervisor: EmployeeWithRef | None = None

    # 自引用列表（团队成员）
    team_members: list[EmployeeWithRef] = Field(default_factory=list)

# 创建实例
ceo = EmployeeWithRef(
    employee_id="CEO001",
    name="CEO",
    supervisor=None,
    team_members=[]
)

manager = EmployeeWithRef(
    employee_id="MGR001",
    name="经理",
    supervisor=ceo,
    team_members=[]
)

employee = EmployeeWithRef(
    employee_id="EMP001",
    name="员工",
    supervisor=manager,
    team_members=[]
)

# 访问自引用字段
print(f"员工: {employee.name}")
print(f"上级: {employee.supervisor.name}")
print(f"上级的上级: {employee.supervisor.supervisor.name}")
```

## 配置模型

### 模型配置类

```python
from pydantic import BaseModel, ConfigDict

class UserConfig(BaseModel):
    # model_config = ConfigDict(...) 是 Pydantic v2 配置模型的推荐方式
    # 相比 v1 的 class Config，用 ConfigDict 更简洁且类型安全
    model_config = ConfigDict(
        # extra 参数控制额外字段的行为：
        # - "ignore": 忽略额外字段（默认）
        # - "forbid": 禁止额外字段
        # - "allow": 允许额外字段
        extra="ignore",  

        # str_to_lower/str_to_upper: 自动转换字符串大小写
        str_to_lower=True,        # 字符串转小写
        str_to_upper=False,       # 字符串转大写

        # populate_by_name: 允许使用原始字段名创建实例（即使有 alias）
        populate_by_name=True,    # 允许使用原始字段名

        # float_precision: 序列化时浮点数的精度（小数位数）
        float_precision=2,        # 保留2位小数

        # json_schema_extra: 为生成的 JSON Schema 添加自定义信息
        # 这些信息对于 API 文档生成很有用（如 Swagger/OpenAPI）
        json_schema_extra={
            "example": {
                "name": "示例用户",
                "age": 25
            }
        }
    )

    name: str
    age: int
    email: str

# 测试配置
user = UserConfig(
    name="ZHANG SAN",     # 会转换为小写
    age=25,
    email="TEST@EXAMPLE.COM"  # 会转换为小写
)

print(user.name)    # 输出: zhang san
print(user.email)  # 输出: test@example.com
```

### 使用 ConfigDict 的高级配置

```python
from pydantic import BaseModel, ConfigDict, ValidationError

class AdvancedConfig(BaseModel):
    # 使用 ConfigDict 配置模型的高级选项
    model_config = ConfigDict(
        # validate_assignment: 赋值时验证（当属性被修改时也进行验证）
        validate_assignment=True,  # 赋值时验证

        # strict=True: 严格模式，不允许类型强制转换
        # 例如：age="25" (字符串) 在 strict 模式下会报错，而正常模式会转为 int
        strict=True,                # 严格模式

        # extra="forbid": 禁止传入未声明的字段，传入会报错
        extra="forbid",             # 禁止未声明字段

        # populate_by_name: 允许通过原始字段名或别名来创建实例
        populate_by_name=True,

        # title: 模型的标题（用于 API 文档）
        # json_schema_extra: 自定义 JSON Schema 的附加信息
        title="用户模型",
        json_schema_extra={
            "description": "用户信息数据模型",
            "version": "1.0.0",
        },
    )

    user_id: str
    name: str
    created_at: str
    balance: float

# strict 模式测试
try:
    user = AdvancedConfig(
        user_id="U001",
        name="张三",
        created_at="2024-01-01",
        balance="100"  # 字符串会报错，因为 strict=True
    )
except ValidationError as e:
    print(f"严格模式错误: {e}")

# 正常模式
user = AdvancedConfig(
    user_id="U001",
    name="张三",
    created_at="2024-01-01",
    balance=100  # 正确类型
)

print(f"用户ID: {user.user_id}")
```

## 数据序列化

### 模型_dump 和模型_dump_json

```python
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID

class Product(BaseModel):
    product_id: UUID
    name: str
    price: float
    tags: List[str]
    created_at: datetime

# 创建产品实例
product = Product(
    product_id=UUID("12345678-1234-1234-1234-123456789012"),
    name="iPhone 15",
    price=6999.0,
    tags=["手机", "Apple"],
    created_at=datetime(2024, 1, 1, 0, 0, 0)
)

# 转换为字典
product_dict = product.model_dump()
print(f"字典: {product_dict}")

# model_dump 方法的参数说明：
# - exclude_none: 排除值为 None 的字段
# - include: 只包含指定的字段（集合）
# - exclude: 排除指定的字段（集合）
# - by_alias: 使用别名（Field 的 alias）作为键名
product_dict_exclude_none = product.model_dump(exclude_none=True)
print(f"排除 None: {product_dict_exclude_none}")

# 转换特定字段
product_dict_partial = product.model_dump(include=["name", "price"])
print(f"部分字段: {product_dict_partial}")

# model_dump_json: 转换为 JSON 字符串
# 可选参数：
# - indent: 格式化缩进（用于美化输出）
# - by_alias: 使用别名
# - exclude_none: 排除 None 值
product_json = product.model_dump_json()
print(f"JSON: {product_json}")

# 格式化 JSON 输出
product_json_formatted = product.model_dump_json(
    indent=2,  # 格式化输出
    by_alias=True
)
print(f"格式化 JSON: {product_json_formatted}")
```

### 自定义序列化器

```python
from pydantic import BaseModel, field_serializer
from datetime import datetime, date
from typing import List

class Order(BaseModel):
    order_id: str
    amount: float
    created_at: datetime
    items: List[str]

    # @field_serializer 装饰器用于自定义字段的序列化行为
    # 作用：在 model_dump() 时对字段值进行自定义转换
    # 参数：字段名字符串
    @field_serializer("amount")
    def serialize_amount(self, amount: float) -> str:
        # 将金额格式化为货币字符串
        return f"¥{amount:,.2f}"

    @field_serializer("created_at")
    def serialize_datetime(self, dt: datetime) -> str:
        # 将日期时间格式化为字符串
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    # 序列化列表字段
    @field_serializer("items")
    def serialize_items(self, items: List[str]) -> str:
        # 将列表序列化为逗号分隔的字符串
        return ", ".join(items)

# 创建订单
order = Order(
    order_id="ORD001",
    amount=1234.56,
    created_at=datetime(2024, 1, 1, 12, 30, 45),
    items=["商品1", "商品2", "商品3"]
)

# 序列化输出
print(order.model_dump())
# 输出: {
#     'order_id': 'ORD001',
#     'amount': '¥1,234.56',
#     'created_at': '2024-01-01 12:30:45',
#     'items': '商品1, 商品2, 商品3'
# }
```

## 继承和组合

### 模型继承

```python
from pydantic import BaseModel, field_validator

# 基类：基础信息
class BaseInfo(BaseModel):
    # populate_by_name=True: 允许使用原始字段名或别名来创建实例
    # 这是 v2 版本的配置方式，v1 使用 class Config
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    created_at: str

# 中间类：用户信息（继承 BaseInfo）
class UserBase(BaseInfo):
    email: str
    phone: Optional[str] = None

# 子类：完整用户模型（继承 UserBase）
class User(UserBase):
    # 新增字段
    age: int
    address: str
    is_active: bool = True

    # 字段验证器：验证 age 字段
    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v < 0 or v > 150:
            raise ValueError("年龄必须在 0-150 之间")
        return v

# 管理员用户（扩展用户模型）
class AdminUser(User):
    permissions: List[str]
    department: str

# 创建用户
user = User(
    id="U001",
    name="张三",
    email="zhangsan@example.com",
    age=25,
    address="北京市朝阳区"
)

print(f"用户: {user.name}")

# 创建管理员
admin = AdminUser(
    id="A001",
    name="管理员",
    email="admin@example.com",
    age=30,
    address="北京市海淀区",
    permissions=["user:read", "user:write", "admin:manage"],
    department="IT部"
)

print(f"管理员部门: {admin.department}")
print(f"管理员权限: {admin.permissions}")
```

### 模型组合

```python
from pydantic import BaseModel, field_validator

# 组合模型：地址
class Address(BaseModel):
    street: str
    city: str
    country: str = "中国"

# 组合模型：联系人
class Contact(BaseModel):
    phone: str
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("邮箱格式不正确")
        return v

# 组合模型：员工信息
class EmployeeInfo(BaseModel):
    employee_id: str
    department: str
    position: str

# 完整员工（组合多个模型）
class Employee(BaseModel):
    info: EmployeeInfo
    address: Address
    contact: Contact
    emergency_contact: Optional[Contact] = None

# 创建员工
employee = Employee(
    info=EmployeeInfo(
        employee_id="E001",
        department="技术部",
        position="高级工程师"
    ),
    address=Address(
        street="科技路123号",
        city="北京",
        country="中国"
    ),
    contact=Contact(
        phone="13800138000",
        email="zhangsan@example.com"
    )
)

# 访问组合字段
print(f"员工ID: {employee.info.employee_id}")
print(f"城市: {employee.address.city}")
print(f"邮箱: {employee.contact.email}")
```

## Settings 管理

### Pydantic Settings

```python
# 导入 Settings 类（需要先 pip install pydantic-settings）
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# 定义应用配置
class Settings(BaseSettings):
    # 必填配置：没有默认值，必须通过环境变量或 .env 文件提供
    app_name: str
    database_url: str

    # 可选配置（带默认值）
    debug: bool = False
    port: int = 8000
    host: str = "localhost"

    # SettingsConfigDict 是 pydantic-settings 的配置类
    # - env_prefix: 环境变量前缀，如 APP_APP_NAME 对应 app_name
    # - env_file: .env 文件路径，用于从文件加载环境变量
    # - case_sensitive: 环境变量名是否区分大小写
    model_config = SettingsConfigDict(
        env_prefix="APP_",  # 环境变量前缀：APP_DEBUG, APP_PORT
        env_file=".env",  # .env 文件路径
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

# 从环境变量加载配置
# 示例环境变量：
# 导出 APP_APP_NAME=myapp
# 导出 APP_DEBUG=true
# 导出 APP_DATABASE_URL=postgresql://localhost:5432/mydb

settings = Settings()

print(f"应用名称: {settings.app_name}")
print(f"调试模式: {settings.debug}")
print(f"端口: {settings.port}")
```

### 嵌套 Settings

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

# 数据库配置
class DatabaseSettings(BaseSettings):
    host: str = "localhost"
    port: int = 5432
    name: str = "mydb"
    user: str
    password: str

    model_config = SettingsConfigDict(env_prefix="DB_")

# Redis 配置
class RedisSettings(BaseSettings):
    host: str = "localhost"
    port: int = 6379
    db: int = 0
    password: Optional[str] = None

    model_config = SettingsConfigDict(env_prefix="REDIS_")

# 邮件配置
class EmailSettings(BaseSettings):
    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    from_email: str

    model_config = SettingsConfigDict(env_prefix="EMAIL_")

# 应用完整配置
class AppSettings(BaseSettings):
    app_name: str = "MyApp"
    debug: bool = False

    # 使用 Field 的 default_factory 创建嵌套配置实例
    # default_factory 在每次创建实例时调用，生成新的配置对象
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    email: EmailSettings = Field(default_factory=EmailSettings)

    # 使用 lambda 函数设置默认值
    api_keys: List[str] = Field(default_factory=list)
    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    model_config = SettingsConfigDict(
        env_file=".env",
        # env_nested_delimiter: 嵌套配置的分割符
        # 例如：EMAIL__SMTP_HOST 会映射到 email.smtp_host
        env_nested_delimiter="__",  # 使用 __ 分隔嵌套配置
    )

# 环境变量示例：
# DB_USER=myuser
# DB_PASSWORD=mypassword
# REDIS_HOST=redis.example.com
# EMAIL__SMTP_HOST=smtp.example.com（双下划线表示嵌套）

settings = AppSettings()

print(f"数据库用户: {settings.database.user}")
print(f"Redis 主机: {settings.redis.host}")
print(f"SMTP 主机: {settings.email.smtp_host}")
```

## ORM 模式集成

### SQLAlchemy 模型集成

```python
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import declarative_base

# 创建 SQLAlchemy 基类（所有模型都需要继承这个基类）
Base = declarative_base()

# SQLAlchemy 模型：数据库表结构定义
class ProductORM(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    in_stock = Column(Boolean, default=True)

# Pydantic 模型（用于创建/更新操作）
class ProductCreate(BaseModel):
    # ConfigDict(from_attributes=True) 是关键配置：
    # - from_attributes=True: 允许从 ORM 对象（如 SQLAlchemy 模型）创建 Pydantic 模型
    # - 这使得可以从数据库查询结果直接转换为 Pydantic 模型
    model_config = ConfigDict(from_attributes=True)

    name: str
    price: float
    in_stock: bool = True

# Pydantic 模型（用于读取操作，包含 id 字段）
class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: float
    in_stock: bool

# Pydantic 模型（用于部分更新，所有字段都是可选的）
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    in_stock: Optional[bool] = None

# 模拟从数据库查询
from sqlalchemy.orm import Session

def create_product(db: Session, product: ProductCreate):
    # 将 Pydantic 模型转换为字典，再传给 SQLAlchemy
    db_product = ProductORM(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # model_validate：从 ORM 对象创建 Pydantic 模型（需要 from_attributes=True）
    return ProductRead.model_validate(db_product)

# 使用示例
db_product = ProductORM(id=1, name="iPhone", price=6999.0, in_stock=True)
product_read = ProductRead.model_validate(db_product)

print(f"产品ID: {product_read.id}")
print(f"产品名称: {product_read.name}")
```

## 错误处理

### 验证错误处理

```python
from pydantic import BaseModel, ValidationError, field_validator
from typing import List, Optional

class UserModel(BaseModel):
    name: str
    email: str
    age: int

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("邮箱格式不正确")
        return v

# 方法 1：使用 try-except 捕获 ValidationError
try:
    user = UserModel(
        name="张三",
        email="invalid-email",  # 无效邮箱
        age=25
    )
except ValidationError as e:
    # e.errors() 返回验证错误的列表，每个错误包含：
    # - loc: 错误位置（字段路径），是一个元组如 ('email',)
    # - type: 错误类型，如 'value_error'
    # - msg: 错误消息描述
    for error in e.errors():
        print(f"字段: {error['loc']}")
        print(f"错误类型: {error['type']}")
        print(f"错误消息: {error['msg']}")
        print("---")

# 方法 2：使用 model_validator 的 error collector
class FormModel(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str

    @field_validator("name", "email", "password")
    @classmethod
    def validate_fields(cls, v, info):
        if info.field_name == "name" and len(v) < 2:
            raise ValueError("姓名至少2个字符")
        if info.field_name == "email" and "@" not in v:
            raise ValueError("邮箱格式不正确")
        if info.field_name == "password" and len(v) < 8:
            raise ValueError("密码至少8个字符")
        return v

# 方法 3：友好的错误消息
def validate_user_data(data: dict) -> tuple[bool, Optional[str]]:
    """验证用户数据，返回 (是否成功, 错误消息)"""
    try:
        UserModel(**data)
        return True, None
    except ValidationError as e:
        errors = e.errors()
        first_error = errors[0]
        field = ".".join(str(loc) for loc in first_error["loc"])
        message = first_error["msg"]
        return False, f"{field}: {message}"

# 使用验证函数
is_valid, error_msg = validate_user_data({
    "name": "张",
    "email": "invalid",
    "age": 25
})

if not is_valid:
    print(f"验证失败: {error_msg}")
```

## 高级特性

### 函数验证器

```python
from pydantic import BaseModel, BeforeValidator
from typing import Annotated

# 自定义验证器函数
def validate_phone_number(v: str) -> str:
    """验证并格式化手机号"""
    # 移除非数字字符
    digits = "".join(filter(str.isdigit, v))

    # 验证长度
    if len(digits) != 11:
        raise ValueError("手机号必须是11位")

    # 验证开头
    if not digits.startswith("1"):
        raise ValueError("手机号必须以1开头")

    return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"

# Annotated + BeforeValidator 是 Pydantic v2 的新用法
# - Annotated: 类型注解容器，用于添加元数据
# - BeforeValidator: 验证器，定义在字段值被解析之前执行的转换/验证逻辑
# 用法：Annotated[目标类型, BeforeValidator(验证函数)]
class Contact(BaseModel):
    name: str
    # BeforeValidator 在字段值被赋值前执行，用于数据预处理和验证
    phone: Annotated[str, BeforeValidator(validate_phone_number)]

# 测试
contact = Contact(
    name="张三",
    phone="13800138000"
)

print(f"手机号: {contact.phone}")  # 输出: 138-0013-8000

# 自动格式化
contact2 = Contact(
    name="李四",
    phone="139-1234-5678"
)

print(f"手机号2: {contact2.phone}")
```

### 模型提取和排除

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    username: str
    email: str
    password: str  # 敏感字段
    created_at: str
    updated_at: str
    is_active: bool
    is_admin: bool  # 敏感字段

# 创建用户
user = User(
    id=1,
    username="zhangsan",
    email="zhangsan@example.com",
    password="hashed_password_123",
    created_at="2024-01-01",
    updated_at="2024-01-01",
    is_active=True,
    is_admin=False
)

# 排除敏感字段用于公开
public_user = user.model_dump(
    exclude={"password", "is_admin"}
)
print(f"公开用户: {public_user}")

# 只包含特定字段
id_only = user.model_dump(
    include={"id", "username"}
)
print(f"仅 ID 和用户名: {id_only}")

# 复制模型并更新
user_inactive = user.model_copy(
    update={"is_active": False}
)
print(f"更新后的活跃状态: {user_inactive.is_active}")
```

## 最佳实践

### 1. 使用类型注解

```python
from pydantic import BaseModel
from typing import List, Optional, Dict

# ✅ 推荐：明确类型注解
class GoodModel(BaseModel):
    name: str
    tags: List[str]
    metadata: Dict[str, str]
    parent_id: Optional[int] = None

# ❌ 避免：使用 any
class BadModel(BaseModel):
    name: any
    data: any
```

### 2. 使用 Field 提供文档

```python
from pydantic import BaseModel, Field

class DocumentedModel(BaseModel):
    name: str = Field(description="用户姓名", examples=["张三"])
    age: int = Field(description="用户年龄", ge=0, le=150, examples=[25])
    email: str = Field(description="邮箱地址", examples=["user@example.com"])
```

### 3. 分层模型设计

```python
from pydantic import BaseModel
from typing import List, Optional

# 基础模型
class Address(BaseModel):
    street: str
    city: str
    country: str

# 中间模型
class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    address: Optional[Address] = None

class UserRead(UserBase):
    id: int
    address: Address
    is_active: bool

# 使用分层模型
user = UserRead(
    id=1,
    name="张三",
    email="zhangsan@example.com",
    address=Address(street="科技路", city="北京", country="中国"),
    is_active=True
)
```

### 4. 合理的验证层次

```python
from pydantic import BaseModel, field_validator

class RegisterForm(BaseModel):
    username: str
    email: str
    password: str
    confirm_password: str

    # 字段级别验证：使用 @field_validator 装饰单个字段
    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError("用户名至少3个字符")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if "@" not in v:
            raise ValueError("邮箱格式不正确")
        return v

    # 跨字段验证：使用 info 参数访问其他字段值
    # info.data: 包含同一模型中其他已验证字段的字典
    # 这样可以比较 confirm_password 和 password 是否一致
    @field_validator("confirm_password")
    @classmethod
    def validate_passwords_match(cls, v, info):
        # info.data 包含已验证的其他字段
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("两次输入的密码不一致")
        return v
```

## 与 FastAPI 集成

### FastAPI 中的 Pydantic

```python
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field, field_validator, HttpUrl
from typing import Optional, List

app = FastAPI()

# 请求模型
class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tags: List[str] = Field(default_factory=list)

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError("价格必须大于0")
        return v

# 响应模型
class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    tags: List[str]

    model_config = ConfigDict(from_attributes=True)  # 支持 ORM 模式

# URL 模型
class Website(BaseModel):
    url: HttpUrl  # 自动验证 URL 格式

# 使用路由
@app.post("/items/", response_model=Item)
async def create_item(item: ItemCreate):
    return item

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    return Item(
        id=item_id,
        name="示例商品",
        price=99.99,
        tags=["示例"]
    )

# 测试 URL 验证
@app.post("/websites/")
async def create_website(website: Website):
    return {"url": website.url}
```

## 常见问题

### Q1：如何处理枚举类型？

```python
from pydantic import BaseModel
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Order(BaseModel):
    order_id: str
    status: OrderStatus

# 使用枚举值
order = Order(order_id="ORD001", status=OrderStatus.PENDING)
print(order.status)  # 输出: OrderStatus.PENDING
print(order.status.value)  # 输出: pending
```

### Q2：如何处理日期时间？

```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date

class Event(BaseModel):
    event_name: str
    start_date: date
    end_date: date
    created_at: datetime = Field(default_factory=datetime.now)

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, v, info):
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("结束日期不能在开始日期之前")
        return v

# 创建事件
event = Event(
    event_name="会议",
    start_date=date(2024, 1, 1),
    end_date=date(2024, 1, 3)
)

print(f"事件名称: {event.event_name}")
print(f"开始日期: {event.start_date}")
```

### Q3：如何处理循环引用？

```python
from __future__ import annotations

from pydantic import BaseModel, Field

class Comment(BaseModel):
    comment_id: str
    content: str
    replies: list[Comment] = Field(default_factory=list)

# 或者使用 model_rebuild
class Post(BaseModel):
    post_id: str
    title: str
    comments: list[Comment] = Field(default_factory=list)

# 处理循环引用的方法：
# 1. 使用 from __future__ import annotations（推荐）：将类型注解延迟求值
# 2. 使用字符串引用：field: "ClassName"
# 3. 使用 model_rebuild()：在类定义后手动构建模型
Post.model_rebuild()

# 测试
comment = Comment(
    comment_id="C001",
    content="这是一条评论",
    replies=[
        Comment(comment_id="C002", content="回复1", replies=[]),
        Comment(comment_id="C003", content="回复2", replies=[])
    ]
)

print(f"评论: {comment.content}")
print(f"回复数: {len(comment.replies)}")
```

## 总结

| 特性 | 说明 | 关键组件 |
|------|------|---------|
| **基础模型** | 使用 BaseModel 定义数据模型 | BaseModel |
| **字段验证** | 使用 Field 添加约束 | Field, field_validator |
| **嵌套模型** | 定义复杂数据结构 | 嵌套类定义 |
| **配置** | 使用 ConfigDict 配置模型行为 | ConfigDict |
| **序列化** | 数据导出和转换 | model_dump, model_dump_json |
| **Settings** | 管理应用配置 | BaseSettings |
| **ORM 集成** | 与数据库模型集成 | from_attributes |
| **错误处理** | 友好的验证错误信息 | ValidationError |

Pydantic 是现代 Python 应用开发中不可或缺的数据验证工具，掌握以上内容可以帮助你构建更加健壮和类型安全的应用。
