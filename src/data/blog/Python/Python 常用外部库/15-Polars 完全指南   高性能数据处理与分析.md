---
title: Polars 完全指南   高性能数据处理与分析
author: Joekma
pubDatetime: 2026-08-07T00:00:00.000+08:00
slug: polars
featured: false
draft: false
tags:
  - Python
  - Polars
  - docs
description: Polars 高性能数据处理完全指南，涵盖 Series、DataFrame、表达式、数据清洗、分组聚合、数据连接、LazyFrame、查询优化与文件 I/O。
series: Python常用外部库
seriesOrder: 15
language: zh-CN
---

# Polars 完全指南 - 高性能数据处理与分析

## 简介

Polars 是一个面向结构化数据的高性能 DataFrame 库。它的核心由 Rust
实现，并通过列式内存布局、并行执行和查询优化器，为 Python 提供快速且内存高效的数据处理能力。

与把“逐行处理”作为直觉起点的写法不同，Polars 鼓励把计算描述成**表达式**：先说明要处理哪些列、执行哪些变换，再由执行引擎统一安排计算。这套思路既适用于内存中的 `DataFrame`，也适用于可延迟执行的 `LazyFrame`。

### 核心特性

| 特性            | 说明                            | 实际价值                     |
| --------------- | ------------------------------- | ---------------------------- |
| **列式执行**    | 同一列的数据连续处理            | 聚合、筛选和数值计算更高效   |
| **多线程并行**  | 许多算子会自动使用多个 CPU 核心 | 通常不必手写并行代码         |
| **表达式 API**  | 用可组合表达式描述列变换        | 代码清晰，便于优化和复用     |
| **Lazy API**    | 先构建查询计划，最后统一执行    | 支持谓词下推、投影下推等优化 |
| **严格 Schema** | 每列拥有明确且稳定的数据类型    | 更早发现脏数据和类型错误     |
| **流式执行**    | 支持分批处理可流式化的查询      | 降低大文件处理的峰值内存     |

### 适用场景

- **数据清洗**：处理缺失值、重复记录、异常类型和文本字段
- **分析报表**：完成筛选、分组、透视、窗口统计和指标计算
- **ETL 管道**：从 CSV、Parquet 等文件读取、转换并写回结果
- **特征工程**：通过表达式批量构造模型输入特征
- **日志处理**：扫描大量事件数据，只读取查询真正需要的列和行
- **Pandas 加速迁移**：将性能敏感的数据处理任务迁移到 Polars

### 第一个 Polars 程序

下面用一份小型销售订单数据完成“派生金额—筛选有效订单—按城市汇总”的基本流程。

```python
import polars as pl

# 创建销售订单数据
orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003, 1004],
    "city": ["北京", "上海", "北京", "深圳"],
    "quantity": [2, 1, 3, 2],
    "unit_price": [199.0, 299.0, 99.0, 159.0],
    "status": ["paid", "cancelled", "paid", "paid"],
})

summary = (
    orders
    .with_columns(
        (pl.col("quantity") * pl.col("unit_price")).alias("amount")
    )
    .filter(pl.col("status") == "paid")
    .group_by("city")
    .agg(pl.col("amount").sum().alias("sales"))
    .sort("city")
)

print(summary)
# 预期：北京销售额 695.0，深圳销售额 318.0
```

这段代码没有编写逐行循环。`pl.col("quantity")` 和
`pl.col("unit_price")` 都是表达式，Polars 会在底层以列为单位完成计算。

> **核心思路**：在 Polars 中，优先思考“这一列要怎样变换”，而不是“每一行要怎样处理”。

## 安装与配置

### 安装 Polars

Polars 支持主流 Python 包管理方式。教程中的基础示例只依赖 `polars`；需要与 Pandas 或 Arrow 互操作时，再按需安装对应依赖。

| 需求          | 安装命令                              | 说明                    |
| ------------- | ------------------------------------- | ----------------------- |
| 基础环境      | `pip install polars`                  | 适合本文全部核心内容    |
| Conda 环境    | `conda install -c conda-forge polars` | 由 conda-forge 提供     |
| Pandas 互操作 | `pip install polars pandas pyarrow`   | 用于 `to_pandas` 等转换 |
| 常见可选功能  | `pip install "polars[all]"`           | 会安装较多可选依赖      |

```bash
# 使用 pip 安装
python -m pip install polars

# 使用 conda-forge 安装
conda install -c conda-forge polars

# 查看已安装版本
python -c "import polars as pl; print(pl.__version__)"
```

建议在虚拟环境中安装依赖，并在项目中锁定经过测试的版本。升级 Polars 后，应重新运行数据管道测试，尤其要检查类型推断、连接和时间处理结果。

### 导入与显示配置

Polars 的标准别名是 `pl`。`pl.Config` 可以调整表格的显示方式，适合在终端或 Notebook 中查看结果，但不会改变底层数据。

```python
import polars as pl

print(f"Polars version: {pl.__version__}")

# 设置当前进程中的表格显示选项
pl.Config.set_tbl_rows(8)
pl.Config.set_tbl_cols(8)
pl.Config.set_fmt_str_lengths(30)

df = pl.DataFrame({
    "product": ["键盘", "显示器"],
    "price": [299.0, 1599.0],
})
print(df)
# 预期：显示 2 行 2 列，字符串不会超过 30 个字符
```

需要临时修改显示配置时，可以把 `pl.Config` 当作上下文管理器使用。退出 `with` 语句块后，原有配置会自动恢复。

```python
import polars as pl

df = pl.DataFrame({
    "value": [1.0 / 3.0, 2.0 / 3.0],
    "description": ["第一个较长的说明文本", "第二个较长的说明文本"],
})

with pl.Config(float_precision=3, fmt_str_lengths=8):
    print(df)
    # 预期：浮点数显示 3 位小数，长字符串在显示时被截断

# 数据本身没有因显示设置而改变
print(df["value"].to_list())
```

> **注意**：不要使用 `from polars import *`。统一写成 `import polars as pl`，可以避免命名冲突，也便于辨认表达式来自 Polars。

## 核心数据结构

Polars 最常用的三个对象是 `Series`、`DataFrame` 和 `LazyFrame`。前两者立即保存数据，后者主要保存尚未执行的查询计划。

| 数据结构    | 维度         | 是否立即执行 | 典型用途                     |
| ----------- | ------------ | ------------ | ---------------------------- |
| `Series`    | 一维         | 是           | 表示具有单一数据类型的一列   |
| `DataFrame` | 二维         | 是           | 交互分析、小中型内存数据处理 |
| `LazyFrame` | 二维查询计划 | 否           | 文件扫描、复杂管道和查询优化 |
| `Expr`      | 列计算描述   | 随上下文执行 | 选择、变换、聚合和窗口计算   |

### Series

`Series` 是带名称的一维数据。与 Python 列表不同，一个 Series 通常只有一种数据类型，数值操作会按列执行。

```python
import polars as pl

# 显式指定名称和类型
prices = pl.Series("price", [199, 299, None, 159], dtype=pl.Int64)

print(prices)
print(f"名称: {prices.name}")          # price
print(f"类型: {prices.dtype}")        # Int64
print(f"长度: {prices.len()}")        # 4
print(f"空值数: {prices.null_count()}")  # 1

# Series 运算同样是向量化的
discounted = prices * 0.9
print(discounted)
# 预期：179.1、269.1、null、143.1
```

### DataFrame

`DataFrame` 是由多列 Series 组成的二维表。所有列必须拥有相同的行数，每个列名在同一张表中必须唯一。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003],
    "product": ["键盘", "鼠标", "显示器"],
    "quantity": [2, 1, 3],
})

print(orders)
print(f"形状: {orders.shape}")       # (3, 3)
print(f"高度: {orders.height}")      # 3
print(f"宽度: {orders.width}")       # 3
print(f"列名: {orders.columns}")
print(f"Schema: {orders.schema}")
```

### LazyFrame

调用 `DataFrame.lazy()` 或 `pl.scan_*` 会得到 `LazyFrame`。它不会马上计算结果；只有调用 `collect()`、`sink_*()` 等执行方法后，查询才真正运行。

```python
import polars as pl

orders = pl.DataFrame({
    "city": ["北京", "上海", "北京", "深圳"],
    "amount": [398.0, 299.0, 297.0, 318.0],
    "status": ["paid", "cancelled", "paid", "paid"],
})

query = (
    orders.lazy()
    .filter(pl.col("status") == "paid")
    .group_by("city")
    .agg(pl.col("amount").sum().alias("sales"))
    .sort("city")
)

print(type(query).__name__)  # LazyFrame
result = query.collect()
print(result)
# 预期：北京 695.0，深圳 318.0
```

### 没有隐式行索引

Polars 不提供类似 Pandas 的隐式行索引。行的含义应由真实业务列表示，例如 `order_id`、`user_id` 或时间戳。需要临时行号时，显式调用 `with_row_index()`。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1003, 1001, 1002],
    "amount": [297.0, 398.0, 299.0],
})

numbered = orders.with_row_index(name="row_no", offset=1)
print(numbered)
# 预期：row_no 为 1、2、3；它是一列普通数据，不是隐藏索引

sorted_orders = numbered.sort("order_id")
print(sorted_orders)
# 排序后 row_no 会随原记录移动，不会被自动重建
```

> **重要**：不要把当前物理行号当作长期业务主键。筛选、拼接和排序都会改变行的位置，稳定标识应来自数据本身。

## 数据类型与 Schema

Schema 是“列名到数据类型”的映射。Polars 在查询构建和执行阶段都会利用 Schema 检查表达式是否合法，因此数据类型不是附属信息，而是计算语义的一部分。

### 常用数据类型

| 类别       | 常用类型                               | 说明                                   |
| ---------- | -------------------------------------- | -------------------------------------- |
| 有符号整数 | `Int8`、`Int16`、`Int32`、`Int64`      | 位宽越小，占用内存越少，取值范围也越小 |
| 无符号整数 | `UInt8`、`UInt16`、`UInt32`、`UInt64`  | 只能表示非负整数                       |
| 浮点数     | `Float32`、`Float64`                   | 适合连续数值和带小数的计算             |
| 布尔值     | `Boolean`                              | 表示 `true`、`false` 或 `null`         |
| 字符串     | `String`                               | UTF-8 文本数据                         |
| 分类值     | `Categorical`、`Enum`                  | 适合重复标签或固定集合                 |
| 日期时间   | `Date`、`Datetime`、`Duration`、`Time` | 日期、时间点、时间差和时刻             |
| 嵌套类型   | `List`、`Array`、`Struct`              | 在一个单元格中保存结构化数据           |
| 精确小数   | `Decimal`                              | 适合需要十进制定点语义的场景           |
| 空类型     | `Null`                                 | 整列暂时只有空值时使用                 |

### 查看与约束 Schema

创建数据时可以让 Polars 推断类型，也可以使用 `schema` 或 `schema_overrides` 明确约束关键列。

```python
import polars as pl

orders = pl.DataFrame(
    {
        "order_id": [1001, 1002, 1003],
        "quantity": [2, 1, 3],
        "unit_price": [199, 299, 99],
        "ordered_at": ["2026-08-01", "2026-08-02", "2026-08-03"],
    },
    schema_overrides={
        "order_id": pl.Int64,
        "quantity": pl.Int32,
        "unit_price": pl.Float64,
    },
)

print(orders.schema)
# 预期：order_id=Int64、quantity=Int32、unit_price=Float64
print(orders.dtypes)
```

对于延迟查询，推荐使用 `collect_schema()` 获取 Schema。直接访问 LazyFrame 的某些属性可能需要额外解析查询计划。

```python
import polars as pl

lazy_orders = pl.DataFrame({
    "order_id": [1001, 1002],
    "quantity": [2, 1],
    "unit_price": [199.0, 299.0],
}).lazy().with_columns(
    (pl.col("quantity") * pl.col("unit_price")).alias("amount")
)

schema = lazy_orders.collect_schema()
print(schema)
print(schema["amount"])  # Float64
```

### 类型转换

`cast()` 用于转换类型。默认情况下转换是严格的，非法值会导致错误；设置 `strict=False` 后，无法转换的值会变成 `null`，适合清洗外部文本数据。

```python
import polars as pl

raw = pl.DataFrame({
    "order_id": ["1001", "1002", "bad"],
    "quantity": ["2", "1", "3"],
    "unit_price": ["199.0", "299.0", "99.0"],
})

cleaned = raw.with_columns(
    pl.col("order_id").cast(pl.Int64, strict=False),
    pl.col("quantity").cast(pl.Int32),
    pl.col("unit_price").cast(pl.Float64),
)

print(cleaned)
# 预期：非法的 order_id="bad" 被转换为 null
print(cleaned.schema)
```

### 分类类型与枚举类型

`Categorical` 适合类别集合可能随数据变化的情况；`Enum` 适合类别集合预先固定的情况。固定集合还能帮助发现超出约束的值。

```python
import polars as pl

status_type = pl.Enum(["pending", "paid", "cancelled"])

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003],
    "status": ["paid", "pending", "cancelled"],
}).with_columns(
    pl.col("status").cast(status_type)
)

print(orders)
print(orders.schema["status"])
# 预期：status 为 Enum(categories=['pending', 'paid', 'cancelled'])
```

> **最佳实践**：对主键、金额、时间和状态等关键列显式约束类型；对不可信文本先使用 `strict=False` 转换，再单独检查产生的空值。

## DataFrame 创建与查看

Polars 可以从字典、行记录、Series、NumPy 数组以及多种文件格式创建 DataFrame。创建阶段应优先保证列名清晰、类型稳定、每列长度一致。

### 常用创建方式

| 来源        | 写法                                 | 适用场景                   |
| ----------- | ------------------------------------ | -------------------------- |
| 列字典      | `pl.DataFrame({"a": [...]})`         | 最直观，适合程序内构造数据 |
| 行记录      | `pl.DataFrame(rows, schema=...)`     | 接口返回元组或逐行记录     |
| 字典列表    | `pl.from_dicts(records)`             | JSON 风格记录              |
| Series 列表 | `pl.DataFrame([series_a, series_b])` | 已经拥有多个 Series        |
| NumPy 数组  | `pl.from_numpy(array, schema=...)`   | 科学计算结果转为表格       |
| Arrow 表    | `pl.from_arrow(table)`               | 与 Arrow 生态交换数据      |
| Pandas 表   | `pl.from_pandas(frame)`              | 迁移或兼容旧流程           |

### 从列字典和 Series 创建

```python
import polars as pl

order_ids = pl.Series("order_id", [1001, 1002, 1003])
products = pl.Series("product", ["键盘", "鼠标", "显示器"])

from_series = pl.DataFrame([order_ids, products])
from_columns = pl.DataFrame({
    "order_id": [1001, 1002, 1003],
    "product": ["键盘", "鼠标", "显示器"],
})

print(from_series)
print(from_columns)
# 预期：两张表的内容和 Schema 相同
print(from_series.equals(from_columns))  # True
```

### 从行记录创建

按行提供元组时，应同时给出列名或完整 Schema，避免字段含义依赖位置猜测。

```python
import polars as pl

rows = [
    (1001, "北京", 398.0),
    (1002, "上海", 299.0),
    (1003, "北京", 297.0),
]

orders = pl.DataFrame(
    rows,
    schema={
        "order_id": pl.Int64,
        "city": pl.String,
        "amount": pl.Float64,
    },
    orient="row",
)

print(orders)
# 预期：3 行 3 列，字段类型与 schema 完全一致
```

字典列表允许各条记录缺少部分键，缺失字段会补为 `null`。读取大量外部数据时，文件扫描通常比先构造 Python 字典列表更高效。

```python
import polars as pl

records = [
    {"order_id": 1001, "coupon": "NEW10", "amount": 398.0},
    {"order_id": 1002, "amount": 299.0},
    {"order_id": 1003, "coupon": "VIP20", "amount": 297.0},
]

orders = pl.from_dicts(
    records,
    schema_overrides={"order_id": pl.Int64, "amount": pl.Float64},
)

print(orders.sort("order_id"))
# 预期：订单 1002 的 coupon 为 null
```

### 查看 DataFrame

| 属性或方法         | 作用                | 说明                     |
| ------------------ | ------------------- | ------------------------ |
| `shape`            | 返回 `(行数, 列数)` | 快速了解表格规模         |
| `schema`           | 返回完整 Schema     | 同时查看列名和类型       |
| `columns`          | 返回列名列表        | 适合字段检查             |
| `head(n)`          | 查看前 `n` 行       | 默认 5 行                |
| `tail(n)`          | 查看后 `n` 行       | 默认 5 行                |
| `sample(n)`        | 抽样查看            | 可设置随机种子           |
| `describe()`       | 汇总描述统计        | 结果也是真正的 DataFrame |
| `null_count()`     | 统计每列空值数量    | 数据质量检查常用         |
| `estimated_size()` | 估算内存占用        | 可指定返回单位           |

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003, 1004, 1005],
    "city": ["北京", "上海", "北京", "深圳", "上海"],
    "amount": [398.0, 299.0, None, 318.0, 520.0],
})

print(orders.head(2))
print(orders.tail(2))
print(orders.null_count())
print(orders.describe())
print(f"估算大小: {orders.estimated_size('kb'):.2f} KB")
# 预期：amount 的空值数为 1
```

> **注意**：`head()` 和 `describe()` 适合探索数据，但不要用肉眼抽查代替 Schema、唯一性、空值率和业务约束验证。

## 表达式与上下文

表达式（`Expr`）描述“如何从一列或多列计算结果”，本身并不保存数据。`pl.col()` 选择列，`pl.lit()` 创建字面量，链式方法继续变换结果，`alias()` 则为最终列命名。

### 表达式的组成

一个表达式可以被保存为变量并在多个查询中复用。表达式只有进入 DataFrame 或 LazyFrame 的执行上下文后，才会得到实际结果。

```python
import polars as pl

orders = pl.DataFrame({
    "product": ["键盘", "鼠标", "显示器"],
    "quantity": [2, 1, 3],
    "unit_price": [199.0, 299.0, 99.0],
})

# 这里只是在构造表达式，还没有对数据执行计算
amount_expr = (
    pl.col("quantity").cast(pl.Float64)
    * pl.col("unit_price")
).round(2).alias("amount")

result = orders.select("product", amount_expr)
print(result)
# 预期：amount 分别为 398.0、299.0、297.0
```

### 常用表达式上下文

| 上下文             | 表达式作用                     | 输出行数           |
| ------------------ | ------------------------------ | ------------------ |
| `select()`         | 选择、计算并返回指定列         | 可保持、减少或扩展 |
| `with_columns()`   | 新增或替换列，同时保留其他列   | 通常保持不变       |
| `filter()`         | 用布尔表达式保留符合条件的行   | 减少或不变         |
| `group_by().agg()` | 在每个分组内执行聚合           | 通常减少           |
| `over()`           | 在分组窗口内计算，再映射回原行 | 保持不变           |

```python
import polars as pl

orders = pl.DataFrame({
    "city": ["北京", "上海", "北京", "深圳"],
    "quantity": [2, 1, 3, 2],
    "unit_price": [199.0, 299.0, 99.0, 159.0],
})

selected = orders.select(
    "city",
    (pl.col("quantity") * pl.col("unit_price")).alias("amount"),
)
enriched = orders.with_columns(
    (pl.col("quantity") * pl.col("unit_price")).alias("amount")
)
filtered = enriched.filter(pl.col("amount") >= 300)
grouped = enriched.group_by("city").agg(
    pl.col("amount").sum().alias("sales")
).sort("city")

print(selected)
print(filtered)
print(grouped)
```

### 条件表达式与横向计算

`pl.when().then().otherwise()` 相当于向量化的条件分支。多个条件按书写顺序匹配；未提供 `otherwise()` 时，未命中的结果为 `null`。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003],
    "item_amount": [398.0, 299.0, 297.0],
    "shipping_fee": [0.0, 15.0, 12.0],
})

result = orders.with_columns(
    pl.sum_horizontal("item_amount", "shipping_fee").alias("payable"),
    pl.when(pl.col("item_amount") >= 350)
    .then(pl.lit("high"))
    .when(pl.col("item_amount") >= 300)
    .then(pl.lit("medium"))
    .otherwise(pl.lit("normal"))
    .alias("order_level"),
)

print(result)
# 预期：payable 为 398.0、314.0、309.0
```

> **注意**：同一次 `with_columns()` 中的表达式并行求值，不能可靠地引用同一次调用里刚创建的别名。存在先后依赖时，应连续调用两次 `with_columns()`。

## 数据选择筛选与排序

Polars 的列选择和行筛选都以表达式为中心。列操作写在 `select()` 或 `with_columns()` 中，行条件写在 `filter()` 中，结果顺序需要明确时使用 `sort()`。

### 常用选择与行操作

| 操作       | 写法                         | 说明                       |
| ---------- | ---------------------------- | -------------------------- |
| 选择列     | `select("a", "b")`           | 只返回指定列               |
| 按类型选择 | `select(cs.numeric())`       | 使用 selector 选择数值列   |
| 派生列     | `with_columns(expr)`         | 新增或覆盖列               |
| 筛选行     | `filter(condition)`          | 条件必须产生布尔结果       |
| 排序       | `sort("a", descending=True)` | 可指定多列和空值位置       |
| 去重       | `unique(subset=[...])`       | 可指定保留第一条或最后一条 |
| 删除列     | `drop("a")`                  | 返回不包含指定列的新表     |
| 重命名     | `rename({"old": "new"})`     | 通过映射修改列名           |
| 切片       | `slice(offset, length)`      | 按物理位置截取连续行       |

### 选择与筛选

多个筛选条件使用 `&`、`|` 和 `~` 组合，并为每个比较表达式加括号。不要使用 Python 的 `and`、`or`、`not` 连接 Polars 表达式。

```python
import polars as pl
import polars.selectors as cs

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003, 1004],
    "city": ["北京", "上海", "北京", "深圳"],
    "quantity": [2, 1, 3, 2],
    "unit_price": [199.0, 299.0, 99.0, 159.0],
    "status": ["paid", "cancelled", "paid", "paid"],
})

numeric_view = orders.select("order_id", cs.numeric().exclude("order_id"))
paid_large = orders.filter(
    (pl.col("status") == "paid")
    & (pl.col("quantity") >= 2)
    & (pl.col("city").is_in(["北京", "深圳"]))
).sort("order_id")

print(numeric_view)
print(paid_large)
# 预期：paid_large 包含订单 1001、1003、1004
```

### 排序、去重与字段整理

排序可以同时指定多列及各自方向。需要确定性输出时应显式排序，不要依赖分组、连接或并行执行产生的偶然顺序。

```python
import polars as pl

raw = pl.DataFrame({
    "order_id": [1001, 1002, 1001, 1003],
    "customer_city": ["北京", "上海", "北京", "深圳"],
    "amount": [398.0, 299.0, 420.0, 318.0],
    "updated_at": [1, 1, 2, 1],
    "debug_note": ["old", "ok", "new", "ok"],
})

result = (
    raw.sort(["order_id", "updated_at"])
    .unique(subset=["order_id"], keep="last", maintain_order=True)
    .rename({"customer_city": "city"})
    .drop("debug_note", "updated_at")
    .sort("amount", descending=True)
)

print(result)
# 预期：订单 1001 保留 amount=420.0 的最新记录
```

表达式是默认选择；只有需要把少量结果交给普通 Python 代码时，才考虑 `row()`、`rows()` 或 `to_dicts()`。这些方法会把列式数据物化为 Python 对象，大数据上成本较高。

## 缺失值与数据清洗

Polars 将缺失值表示为 `null`。浮点数中的 `NaN` 是 IEEE 浮点值，并不等同于 `null`；二者的检测、统计和填充方法不同。

| 情况              | 检测方法                      | 常用处理                      |
| ----------------- | ----------------------------- | ----------------------------- |
| 任意类型的 `null` | `is_null()`、`null_count()`   | `fill_null()`、`drop_nulls()` |
| 浮点数的 `NaN`    | `is_nan()`                    | `fill_nan()`                  |
| 正无穷或负无穷    | `is_infinite()`               | 条件替换或筛除                |
| 非法文本类型      | `cast(..., strict=False)`     | 转为 `null` 后统一检查        |
| 重复记录          | `is_duplicated()`、`unique()` | 按业务键去重                  |

### 检测和填充 null

填充值应来自业务语义。金额缺失不一定等于零，状态缺失也不一定能向前填充；在选择策略前要先判断缺失产生的原因。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003, 1004],
    "coupon": ["NEW10", None, None, "VIP20"],
    "amount": [398.0, None, 297.0, 318.0],
})

print(orders.null_count())

filled = orders.with_columns(
    pl.col("coupon").fill_null("NO_COUPON"),
    pl.col("amount").fill_null(pl.col("amount").median()),
)
dropped = orders.drop_nulls(subset=["amount"])

print(filled)
print(dropped)
# 预期：filled 不再包含 null；dropped 删除订单 1002
```

### 区分 NaN 与 null

`NaN` 只出现在浮点类型中。聚合前通常先把无效的 `NaN` 转成 `null`，再按明确规则填充或忽略。

```python
import math
import polars as pl

scores = pl.DataFrame({
    "user_id": [1, 2, 3, 4],
    "score": [90.0, math.nan, None, 80.0],
})

quality = scores.select(
    pl.col("score").is_nan().sum().alias("nan_count"),
    pl.col("score").is_null().sum().alias("null_count"),
)

cleaned = (
    scores.with_columns(pl.col("score").fill_nan(None))
    .with_columns(pl.col("score").fill_null(pl.col("score").mean()))
)

print(quality)  # 预期：nan_count=1，null_count=1
print(cleaned)  # 预期：两个无效值都被均值 85.0 填充
```

### 组合清洗流程

清洗管道通常遵循“标准化文本—宽松转换类型—验证关键字段—按业务键去重”的顺序。每一步都返回新表，便于插入质量检查。

```python
import polars as pl

raw = pl.DataFrame({
    "order_id": [" 1001", "1002", "bad", "1002"],
    "city": [" 北京 ", "上海", "深圳", " 上海"],
    "amount": ["398.0", "299.0", "318.0", "309.0"],
    "version": [1, 1, 1, 2],
})

cleaned = (
    raw.with_columns(
        pl.col("order_id").str.strip_chars().cast(pl.Int64, strict=False),
        pl.col("city").str.strip_chars(),
        pl.col("amount").cast(pl.Float64, strict=False),
    )
    .filter(pl.col("order_id").is_not_null() & pl.col("amount").is_not_null())
    .sort(["order_id", "version"])
    .unique(subset=["order_id"], keep="last", maintain_order=True)
    .sort("order_id")
)

print(cleaned)
# 预期：非法主键被删除，订单 1002 保留 version=2
```

> **最佳实践**：清洗完成后仍要输出质量指标，例如非法转换数、关键列空值数、重复业务键数和最终行数，避免错误被静默吞掉。

## 字符串列表与时间数据

Polars 为复杂类型提供专用命名空间。先用表达式选中列，再进入相应命名空间调用类型相关方法。

| 命名空间  | 适用类型       | 常见方法                                        |
| --------- | -------------- | ----------------------------------------------- |
| `.str`    | `String`       | `contains`、`replace_all`、`extract`、`to_date` |
| `.list`   | `List`         | `len`、`get`、`contains`、`eval`、`explode`     |
| `.dt`     | 日期时间类型   | `year`、`month`、`truncate`、`strftime`         |
| `.struct` | `Struct`       | `field`、`rename_fields`、`unnest`              |
| `.name`   | 任意表达式结果 | 批量添加前缀、后缀或修改列名                    |

### 字符串处理

字符串方法按列执行。许多匹配方法默认支持正则表达式；如果输入来自用户，应先确认它应被当作正则还是普通文本。

```python
import polars as pl

customers = pl.DataFrame({
    "customer_id": [1, 2, 3],
    "email": [" ALICE@EXAMPLE.COM ", "bob@test.cn", "invalid-email"],
    "phone": ["138-0013-8000", "139 0013 9000", "0755-12345678"],
})

cleaned = customers.with_columns(
    pl.col("email").str.strip_chars().str.to_lowercase(),
    pl.col("phone").str.replace_all(r"\D", "").alias("phone_digits"),
).with_columns(
    pl.col("email").str.extract(r"@(.+)$", group_index=1).alias("domain"),
    pl.col("email").str.contains(r"^[^@]+@[^@]+\.[^@]+$").alias("email_valid"),
)

print(cleaned)
# 预期：首个邮箱被标准化，invalid-email 的 domain 为 null
```

### 列表列

列表列在一个单元格中保存零个或多个同类型元素。它适合标签、商品集合和嵌套事件，但如果每个元素都应成为独立记录，通常应使用 `explode()` 展开。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003],
    "tags": [["NEW", "KEYBOARD"], ["MOUSE"], []],
    "item_prices": [[199.0, 199.0], [299.0], [99.0, 99.0, 99.0]],
})

summary = orders.with_columns(
    pl.col("tags").list.len().alias("tag_count"),
    pl.col("tags").list.eval(pl.element().str.to_lowercase()).alias("tags_lower"),
    pl.col("item_prices").list.sum().alias("item_total"),
    pl.col("tags").list.contains("NEW").alias("is_new"),
)

exploded = summary.select("order_id", "tags_lower").explode("tags_lower", empty_as_null=True)
print(summary)
print(exploded.sort(["order_id", "tags_lower"], nulls_last=True))
```

### 日期与时间

外部文件中的时间通常先以字符串读入，再显式解析为 `Date` 或 `Datetime`。解析后才能可靠地按年月、周期和时间差计算。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003],
    "ordered_text": ["2026-08-01 09:30:00", "2026-08-02 14:05:00", "2026-08-03 20:15:00"],
    "shipped_text": ["2026-08-02", "2026-08-04", "2026-08-04"],
})

result = (
    orders.with_columns(
        pl.col("ordered_text").str.to_datetime("%Y-%m-%d %H:%M:%S").alias("ordered_at"),
        pl.col("shipped_text").str.to_date("%Y-%m-%d").alias("shipped_date"),
    )
    .with_columns(
        pl.col("ordered_at").dt.date().alias("ordered_date"),
        pl.col("ordered_at").dt.strftime("%Y-%m").alias("order_month"),
    )
    .with_columns(
        (pl.col("shipped_date") - pl.col("ordered_date"))
        .dt.total_days()
        .alias("shipping_days")
    )
)

print(result.select("order_id", "order_month", "shipping_days"))
# 预期：shipping_days 为 1、2、1
```

> **注意**：生产数据还要明确时区。无时区时间和带时区时间不要直接混用；统一时区后再比较、连接或划分时间窗口。

## 统计分组与窗口

Polars 的统计可以分为三类：整列聚合返回少量结果，分组聚合每组返回结果，窗口表达式则把每组统计映射回原始行。

### 常用统计与聚合

| 函数              | 作用            | 空值行为要点    |
| ----------------- | --------------- | --------------- |
| `count()`         | 统计非空值数量  | 不包含 `null`   |
| `pl.len()`        | 统计行数        | 包含所有行      |
| `sum()`           | 求和            | 通常忽略 `null` |
| `mean()`          | 平均值          | 通常忽略 `null` |
| `median()`        | 中位数          | 通常忽略 `null` |
| `min()` / `max()` | 最小值 / 最大值 | 通常忽略 `null` |
| `n_unique()`      | 不同值数量      | 用于基数统计    |
| `quantile(q)`     | 指定分位数      | 可配置插值方式  |
| `std()` / `var()` | 标准差 / 方差   | 注意样本自由度  |

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003, 1004],
    "customer_id": [1, 2, 1, 3],
    "amount": [398.0, 299.0, None, 318.0],
})

stats = orders.select(
    pl.len().alias("rows"),
    pl.col("amount").count().alias("valid_amounts"),
    pl.col("amount").sum().alias("sales"),
    pl.col("amount").mean().round(2).alias("avg_order"),
    pl.col("amount").quantile(0.5).alias("median_order"),
    pl.col("customer_id").n_unique().alias("customers"),
)

print(stats)
# 预期：rows=4，valid_amounts=3，customers=3
```

### 分组聚合

`group_by()` 负责定义分组键，`agg()` 接收一个或多个聚合表达式。使用命名清晰的别名，并在展示或测试时显式排序。

```python
import polars as pl

orders = pl.DataFrame({
    "city": ["北京", "上海", "北京", "深圳", "上海"],
    "order_id": [1001, 1002, 1003, 1004, 1005],
    "customer_id": [1, 2, 1, 3, 4],
    "amount": [398.0, 299.0, 297.0, 318.0, 520.0],
})

city_summary = (
    orders.group_by("city")
    .agg(
        pl.len().alias("order_count"),
        pl.col("customer_id").n_unique().alias("customer_count"),
        pl.col("amount").sum().alias("sales"),
        pl.col("amount").mean().round(2).alias("avg_order"),
    )
    .sort("city")
)

print(city_summary)
# 预期排序：上海 sales=819.0，北京 sales=695.0，深圳 sales=318.0
```

### 动态时间分组

`group_by_dynamic()` 按固定时间窗口分组，适合日报、周报和滚动周期汇总。输入时间列应先排序，并确认窗口边界是否符合业务口径。

```python
from datetime import datetime
import polars as pl

orders = pl.DataFrame({
    "ordered_at": [
        datetime(2026, 8, 1, 9), datetime(2026, 8, 1, 15),
        datetime(2026, 8, 2, 10), datetime(2026, 8, 2, 18),
    ],
    "city": ["北京", "上海", "北京", "上海"],
    "amount": [398.0, 299.0, 297.0, 520.0],
}).sort("ordered_at")

daily = (
    orders.group_by_dynamic("ordered_at", every="1d", group_by="city")
    .agg(pl.col("amount").sum().alias("sales"))
    .sort(["ordered_at", "city"])
)

print(daily)
# 预期：每个日期、每个城市各形成一个日窗口
```

### 窗口表达式

窗口表达式通过 `over()` 指定分区。它不会像 `group_by().agg()` 那样压缩行，而是把分组统计附加到每条原始记录上。

```python
from datetime import date
import polars as pl

orders = pl.DataFrame({
    "order_id": [1001, 1002, 1003, 1004, 1005],
    "city": ["北京", "上海", "北京", "深圳", "上海"],
    "ordered_date": [date(2026, 8, 1), date(2026, 8, 1), date(2026, 8, 2), date(2026, 8, 2), date(2026, 8, 3)],
    "amount": [398.0, 299.0, 297.0, 318.0, 520.0],
}).sort(["city", "ordered_date", "order_id"])

result = orders.with_columns(
    pl.col("amount").sum().over("city").alias("city_sales"),
    pl.col("amount").rank("dense", descending=True).over("city").alias("city_rank"),
    pl.col("amount").cum_sum().over("city", order_by="ordered_date").alias("city_running_sales"),
).with_columns(
    (pl.col("amount") / pl.col("city_sales")).round(4).alias("city_share")
)

print(result.sort("order_id"))
# 预期：每一行都保留，并带有城市合计、排名、累计额和占比
```

> **选择原则**：只需要每组一行结果时使用 `group_by().agg()`；需要保留明细并附加组内指标时使用 `over()`。

## 连接拼接与重塑

连接按键横向补充字段，拼接把多张同类表纵向或横向合并，重塑则在宽表和长表之间转换。操作前应先确认键的唯一性、类型和空值策略。

| 操作                     | 常用参数                | 用途                   |
| ------------------------ | ----------------------- | ---------------------- |
| `join(..., how="inner")` | `on`、`validate`        | 只保留两边匹配记录     |
| `join(..., how="left")`  | `nulls_equal`、`suffix` | 保留左表全部记录       |
| `join(..., how="full")`  | `coalesce`              | 保留两边全部记录       |
| `join(..., how="semi")`  | `on`                    | 保留左表中存在匹配的行 |
| `join(..., how="anti")`  | `on`                    | 查找左表中未匹配的行   |
| `concat(..., how=...)`   | `vertical_relaxed` 等   | 合并多张表             |
| `unpivot()` / `pivot()`  | `on`、`index`、`values` | 宽表与长表互转         |

### 数据连接

`validate="m:1"` 可验证“多对一”关系；`nulls_equal` 决定两侧空键是否匹配，必须按业务语义设置。

```python
import polars as pl
orders = pl.DataFrame({"order_id": [1001, 1002, 1003], "customer_id": [1, 2, 9], "amount": [398.0, 299.0, 297.0]})
customers = pl.DataFrame({"customer_id": [1, 2], "customer_name": ["小林", "小周"]})
result = orders.join(
    customers, on="customer_id", how="left",
    validate="m:1", nulls_equal=False,
).sort("order_id")
print(result)
# 预期：订单 1003 的 customer_name 为 null
```

### 数据拼接

`vertical_relaxed` 会在可兼容类型之间寻找共同超类型，适合批次间出现 `Int32` 与 `Int64` 等安全差异；字段含义不一致时仍应先统一 Schema。

```python
import polars as pl
jan = pl.DataFrame({"order_id": [1001, 1002], "amount": pl.Series([398, 299], dtype=pl.Int32)})
feb = pl.DataFrame({"order_id": [1003], "amount": pl.Series([520], dtype=pl.Int64)})
all_orders = pl.concat([jan, feb], how="vertical_relaxed").sort("order_id")
print(all_orders)
# 预期：3 条记录，amount 被统一为兼容的整数类型
```

### 宽表与长表互转

长表更适合分组和绘图，宽表更适合展示。`unpivot()` 使用 `on` 指定被展开列；`pivot()` 是 eager 操作，应在需要最终宽表时使用。

```python
import polars as pl
wide = pl.DataFrame({"product": ["键盘", "鼠标"], "q1": [100, 80], "q2": [120, 95]})
long = wide.unpivot(
    on=["q1", "q2"], index="product",
    variable_name="quarter", value_name="sales",
).sort(["product", "quarter"])
restored = long.pivot(
    on="quarter", index="product", values="sales",
    aggregate_function="sum",
).sort("product")
print(long)
print(restored)
```

## 文件 I/O 与互操作

Polars 常用文件接口命名统一：`read_*` 立即读入 DataFrame，`scan_*` 创建 LazyFrame。分析型数据优先使用保留 Schema、压缩率高且支持列裁剪的 Parquet。

| 格式        | 立即读取       | 延迟扫描       | 写出            |
| ----------- | -------------- | -------------- | --------------- |
| CSV         | `read_csv`     | `scan_csv`     | `write_csv`     |
| Parquet     | `read_parquet` | `scan_parquet` | `write_parquet` |
| NDJSON      | `read_ndjson`  | `scan_ndjson`  | `write_ndjson`  |
| IPC / Arrow | `read_ipc`     | `scan_ipc`     | `write_ipc`     |
| Excel       | `read_excel`   | 无             | `write_excel`   |

### CSV

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import polars as pl
with TemporaryDirectory() as tmp:
    path = Path(tmp) / "orders.csv"
    pl.DataFrame({"order_id": [1001, 1002], "amount": [398.0, 299.0]}).write_csv(path)
    loaded = pl.read_csv(path, schema_overrides={"order_id": pl.Int64})
    print(loaded.sort("order_id"))
# 预期：临时目录退出后自动删除，示例不依赖仓库文件
```

### Parquet 与 NDJSON

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import polars as pl
df = pl.DataFrame({"order_id": [1001, 1002], "city": ["北京", "上海"]})
with TemporaryDirectory() as tmp:
    parquet_path, json_path = Path(tmp) / "orders.parquet", Path(tmp) / "orders.ndjson"
    df.write_parquet(parquet_path)
    df.write_ndjson(json_path)
    print(pl.read_parquet(parquet_path))
    print(pl.read_ndjson(json_path))
```

需要交给普通 Python、NumPy、Arrow 或 Pandas 时，可使用 `to_dicts()`、`to_numpy()`、`to_arrow()`、`to_pandas()`；转换可能复制数据或引入可选依赖，宜放在流程边界。

## LazyFrame 与查询优化

Lazy API 先收集完整查询计划，再执行投影下推、谓词下推和公共子表达式消除等优化。具体效果以 `explain()` 输出为准，而不是凭调用顺序猜测。

| 对比        | Eager `DataFrame` | Lazy `LazyFrame`             |
| ----------- | ----------------- | ---------------------------- |
| 执行时机    | 每一步立即执行    | `collect` 或 `sink_*` 时执行 |
| 文件入口    | `read_*`          | `scan_*`                     |
| 全局优化    | 有限              | 可基于完整计划优化           |
| Schema 获取 | `schema`          | `collect_schema()`           |
| 适合场景    | 探索、小数据      | ETL、大文件、复杂查询        |

### 构建和检查查询计划

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import polars as pl
with TemporaryDirectory() as tmp:
    path = Path(tmp) / "orders.csv"
    pl.DataFrame({"city": ["北京", "上海", "北京"], "status": ["paid", "cancelled", "paid"], "amount": [398.0, 299.0, 297.0]}).write_csv(path)
    query = (pl.scan_csv(path).filter(pl.col("status") == "paid")
             .group_by("city").agg(pl.col("amount").sum().alias("sales")).sort("city"))
    print(query.collect_schema())
    print(query.explain(optimized=True))
    print(query.collect())
```

### 流式执行

流式引擎会分批处理支持流式化的算子，从而降低峰值内存；它不保证每个查询都完全流式化，也不等于分布式计算。

```python
import polars as pl
orders = pl.DataFrame({"city": ["北京", "上海", "北京", "深圳"], "amount": [398.0, 299.0, 297.0, 318.0]})
query = (orders.lazy().filter(pl.col("amount") >= 300)
         .group_by("city").agg(pl.col("amount").sum().alias("sales")).sort("city"))
result = query.collect(engine="streaming")
print(result)
# 预期：北京 398.0、上海 299.0 不满足条件、深圳 318.0
```

关于执行模型可继续阅读 Polars 官方的[表达式与上下文](https://docs.pola.rs/user-guide/concepts/expressions-and-contexts/)、[Lazy API](https://docs.pola.rs/user-guide/lazy/using/)和[流式执行](https://docs.pola.rs/user-guide/concepts/streaming/)文档。

## Pandas 迁移与常见陷阱

迁移重点不是逐行翻译方法名，而是改用表达式和查询计划组织计算。可参考官方 [Pandas 迁移指南](https://docs.pola.rs/user-guide/migration/pandas/)。

| Pandas 习惯      | Polars 写法                  | 注意事项                      |
| ---------------- | ---------------------------- | ----------------------------- |
| 隐式索引         | 普通业务列                   | 临时行号用 `with_row_index()` |
| `df.assign(...)` | `with_columns(...)`          | 表达式可并行计算              |
| 布尔 `.loc[...]` | `filter(...)`                | 条件用 `&`、\|、`~`           |
| `groupby(...)`   | `group_by(...)`              | 聚合写入 `agg()`              |
| `apply(axis=1)`  | 原生列表达式                 | 避免 Python 逐行回调          |
| `melt(...)`      | `unpivot(on=..., index=...)` | 使用现行参数名                |
| `inplace=True`   | 重新绑定结果                 | Polars 没有 inplace 工作流    |

```python
import polars as pl
orders = pl.DataFrame({"city": ["北京", "上海", "北京"], "quantity": [2, 1, 3], "unit_price": [199.0, 299.0, 99.0]})
result = (orders.with_columns((pl.col("quantity") * pl.col("unit_price")).alias("amount"))
          .filter(pl.col("amount") >= 300)
          .group_by("city").agg(pl.col("amount").sum().alias("sales"))
          .sort("city"))
print(result)
# 原生表达式取代逐行 apply；结果只有北京 sales=398.0
```

还要牢记：Schema 默认严格；`null` 不等于 `NaN`；`select()` 不会修改原表；分组和连接顺序不应被依赖；同一次 `with_columns()` 中不能串联刚创建的别名。

## 综合实战与性能优化

下面把 CSV 扫描、类型清洗、业务过滤、派生金额、分组汇总、流式收集和 Parquet 输出串成一个可独立运行的流程。

```python
from pathlib import Path
from tempfile import TemporaryDirectory
import polars as pl

raw = pl.DataFrame({
    "order_id": ["1001", "1002", "bad", "1004", "1005"],
    "customer_id": [1, 2, 3, 4, 1],
    "ordered_at": ["2026-08-01", "2026-08-01", "2026-08-02", "2026-08-02", "2026-08-03"],
    "city": [" 北京 ", "上海", "深圳", "北京", "上海"],
    "quantity": ["2", "1", "3", "2", "2"],
    "unit_price": ["199.0", "299.0", "bad", "159.0", "260.0"],
    "status": ["PAID", "cancelled", "paid", "paid", "paid"],
})

with TemporaryDirectory() as tmp:
    source, target = Path(tmp) / "orders.csv", Path(tmp) / "daily_sales.parquet"
    raw.write_csv(source)
    query = (
        pl.scan_csv(source, schema_overrides={"order_id": pl.String})
        .with_columns(
            pl.col("order_id").cast(pl.Int64, strict=False),
            pl.col("ordered_at").str.to_date("%Y-%m-%d", strict=False),
            pl.col("city").str.strip_chars(),
            pl.col("quantity").cast(pl.Int32, strict=False),
            pl.col("unit_price").cast(pl.Float64, strict=False),
            pl.col("status").str.to_lowercase(),
        )
        .filter(pl.col("order_id").is_not_null() & (pl.col("status") == "paid")
                & (pl.col("quantity") > 0) & pl.col("unit_price").is_not_null())
        .with_columns((pl.col("quantity") * pl.col("unit_price")).round(2).alias("amount"))
        .group_by("ordered_at", "city")
        .agg(pl.len().alias("orders"), pl.col("customer_id").n_unique().alias("customers"),
             pl.col("amount").sum().alias("sales"))
        .sort(["ordered_at", "city"])
    )
    result = query.collect(engine="streaming")
    result.write_parquet(target)
    print(pl.read_parquet(target).sort(["ordered_at", "city"]))
# 预期：保留订单 1001、1004、1005，并按日期和城市汇总
```

### 性能优化清单

- 大文件优先 `scan_*`，尽早 `filter()`，只 `select()` 真正需要的列
- 使用原生表达式代替 Python 循环、逐行字典和 `map_elements`
- 在读取阶段约束关键 Schema，避免管道中反复转换类型
- 能一次完成的列变换放入同一个 `with_columns()`，有依赖时再分阶段
- 不要无条件流式化；用真实数据比较默认引擎与 `engine="streaming"`
- 用 `explain()` 检查计划，用端到端耗时和峰值内存验证优化效果
- 在输出前显式排序，保证测试、报表和文件结果可重复

> **总结**：Polars 的性能来自列式表达式、明确 Schema 和整体查询优化。先保证语义正确与结果可验证，再根据执行计划和真实测量优化，而不是依赖零散技巧。
