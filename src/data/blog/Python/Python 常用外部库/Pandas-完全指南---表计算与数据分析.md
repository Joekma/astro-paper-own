---
title: Pandas 完全指南 - 表计算与数据分析
author: Joekma
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - Pandas
  - docs
description: Pandas 数据分析完全指南，涵盖 Series、DataFrame、数据清洗、统计分析等核心功能。
---

# Pandas 完全指南 - 表计算与数据分析

## 简介

Pandas 是一个强大的 Python 数据分析工具包，基于 NumPy 构建，为 Python 提供了高性能、易于使用的数据结构和数据分析工具。

### 核心特性

- **强大的数据结构**：DataFrame 和 Series 提供灵活的数据操作能力
- **时间序列支持**：完整的时间序列处理功能
- **丰富的数学运算**：向量化操作和统计函数
- **灵活的数据处理**：缺失值处理、数据清洗、转换等
- **数据可视化**：与 Matplotlib、Seaborn 等可视化库无缝集成
- **多种数据格式**：支持 CSV、Excel、SQL、JSON 等多种格式

### 应用场景

- **金融数据分析**：股票价格、交易数据、风险分析
- **科学研究**：实验数据处理、统计分析
- **商业智能**：销售数据、用户行为分析
- **网络数据**：日志分析、用户数据挖掘
- **数据清洗**：数据预处理、格式转换

## 安装与配置

### 安装 Pandas

```bash
# 使用 pip 安装
pip install pandas

# 使用 conda 安装
conda install pandas

# 安装特定版本
pip install pandas==1.5.3

# 安装最新开发版
pip install pandas --pre
```

### 依赖包安装

```bash
# 安装常用依赖包
pip install pandas numpy matplotlib seaborn openpyxl xlrd

# 完整数据分析环境
pip install pandas numpy scipy matplotlib seaborn jupyter
```

### 导入与配置

```python
import pandas as pd
import numpy as np

# 设置显示选项
pd.set_option('display.max_rows', 100)  # 显示最大行数
pd.set_option('display.max_columns', 50)  # 显示最大列数
pd.set_option('display.width', 100)  # 显示宽度
pd.set_option('display.float_format', '{:.2f}'.format)  # 浮点数格式

# 检查版本
print(f"Pandas version: {pd.__version__}")
print(f"NumPy version: {np.__version__}")
```

## Series 数据结构

Series 是一种类似于一维数组的对象，由一组数据和一组与之相关的数据标签（索引）组成。它是 Pandas 的基础数据结构之一。

### 创建 Series

```python
import pandas as pd
import numpy as np

# 方式1：从列表创建
s1 = pd.Series([4, 7, -5, 3])
print("从列表创建:")
print(s1)

# 方式2：从列表创建并指定索引
s2 = pd.Series([4, 7, -5, 3], index=['a', 'b', 'c', 'd'])
print("\n从列表创建并指定索引:")
print(s2)

# 方式3：从字典创建
s3 = pd.Series({'a': 1, 'b': 2, 'c': 3})
print("\n从字典创建:")
print(s3)

# 方式4：创建指定值的Series
s4 = pd.Series(0, index=['a', 'b', 'c', 'd'])
print("\n创建指定值的Series:")
print(s4)

# 方式5：从NumPy数组创建
s5 = pd.Series(np.random.randn(5))
print("\n从NumPy数组创建:")
print(s5)

# 方式6：创建时间序列索引的Series
dates = pd.date_range('20230101', periods=5)
s6 = pd.Series(np.random.randn(5), index=dates)
print("\n时间序列索引的Series:")
print(s6)
```

### Series 属性

```python
# 创建示例Series
s = pd.Series([10, 20, 30, 40], index=['a', 'b', 'c', 'd'], name='values')

print(f"Series名称: {s.name}")
print(f"索引: {s.index}")
print(f"值: {s.values}")
print(f"数据类型: {s.dtype}")
print(f"形状: {s.shape}")
print(f"维度: {s.ndim}")
print(f"大小: {s.size}")
```

### Series 的数组特性

Series 继承了 NumPy 数组的特性，支持向量化操作：

```python
# 创建示例Series
s = pd.Series([1, 2, 3, 4], index=['a', 'b', 'c', 'd'])

# 与标量运算
print("标量运算:")
print(f"s * 2: {s * 2}")
print(f"s + 10: {s + 10}")
print(f"s ** 2: {s ** 2}")

# 两个Series运算（自动对齐）
s2 = pd.Series([10, 20, 30, 40], index=['a', 'b', 'c', 'e'])
print("\nSeries运算:")
print(f"s + s2: {s + s2}")

# 位置索引
print("\n位置索引:")
print(f"s[0]: {s[0]}")
print(f"s[[1, 3]]: {s[[1, 3]]}")

# 切片操作
print("\n切片操作:")
print(f"s[1:3]: {s[1:3]}")

# NumPy 通用函数
print("\nNumPy 通用函数:")
print(f"np.abs(s): {np.abs(s)}")
print(f"np.sqrt(s): {np.sqrt(s)}")

# 布尔值过滤
print("\n布尔值过滤:")
print(f"s[s > 2]: {s[s > 2]}")
print(f"s[(s > 1) & (s < 4)]: {s[(s > 1) & (s < 4)]}")
```

### Series 的字典特性

Series 也支持类似字典的操作：

```python
# 创建示例Series
s = pd.Series({'a': 100, 'b': 200, 'c': 300, 'd': 400})

# 键索引
print("键索引:")
print(f"s['a']: {s['a']}")
print(f"s[['a', 'c']]: {s[['a', 'c']]}")

# 键切片
print("\n键切片:")
print(f"s['b':'d']: {s['b':'d']}")

# 字典操作
print("\n字典操作:")
print(f"'a' in s: {'a' in s}")
print(f"'x' in s: {'x' in s}")
print(f"s.get('a', 0): {s.get('a', 0)}")
print(f"s.get('x', 'not found'): {s.get('x', 'not found')}")

# 遍历
print("\n遍历Series:")
for index, value in s.items():
    print(f"索引: {index}, 值: {value}")
```

### 统计函数

```python
# 创建示例Series
s = pd.Series([1, 2, 3, 4, 5, np.nan, 7, 8, 9, 10])

print("基本统计:")
print(f"平均值: {s.mean()}")
print(f"中位数: {s.median()}")
print(f"标准差: {s.std()}")
print(f"方差: {s.var()}")
print(f"最小值: {s.min()}")
print(f"最大值: {s.max()}")
print(f"求和: {s.sum()}")
print(f"计数: {s.count()}")

print("\n累计统计:")
print(f"累计求和: {s.cumsum()}")
print(f"累计乘积: {s.cumprod()}")
print(f"累计最大值: {s.cummax()}")
print(f"累计最小值: {s.cummin()}")

print("\n分位数:")
print(f"25%分位数: {s.quantile(0.25)}")
print(f"50%分位数: {s.quantile(0.5)}")
print(f"75%分位数: {s.quantile(0.75)}")
```

### 描述性统计

```python
# 创建示例Series
s = pd.Series(np.random.randn(1000))

# 获取描述性统计
print("描述性统计:")
print(s.describe())

# 获取特定统计信息
print("\n特定统计信息:")
print(f"非空值数量: {s.count()}")
print(f"唯一值数量: {s.nunique()}")
print(f"最频繁值: {s.mode().iloc[0] if not s.mode().empty else 'None'}")
```

## 整数索引处理

整数索引的 Pandas 对象往往会使新手困惑。理解 `loc` 和 `iloc` 的区别至关重要。

### 问题示例

```python
# 创建整数索引的Series
sr = pd.Series(np.arange(4.), index=[0, 1, 2, 3])
print("Series:")
print(sr)

# 尝试使用负索引
try:
    print(f"sr[-1]: {sr[-1]}")
except KeyError as e:
    print(f"错误: {e}")
```

### 解决方案：loc 和 iloc

```python
# 创建示例Series
sr = pd.Series([10, 20, 30, 40], index=[0, 1, 2, 3])

# loc - 基于标签索引
print("loc - 基于标签:")
print(f"sr.loc[0]: {sr.loc[0]}")  # 标签为0的值
print(f"sr.loc[1:3]: {sr.loc[1:3]}")  # 标签1到3（包含3）

# iloc - 基于位置索引
print("\niloc - 基于位置:")
print(f"sr.iloc[0]: {sr.iloc[0]}")  # 第0个位置的值
print(f"sr.iloc[-1]: {sr.iloc[-1]}")  # 最后一个位置的值
print(f"sr.iloc[1:3]: {sr.iloc[1:3]}")  # 位置1到3（不包含3）
```

### 最佳实践

```python
# 创建混合索引的Series
sr_mixed = pd.Series([100, 200, 300, 400], index=['a', 0, 'b', 1])
print("混合索引Series:")
print(sr_mixed)

# 使用loc访问标签
print("\n使用loc:")
print(f"sr_mixed.loc['a']: {sr_mixed.loc['a']}")
print(f"sr_mixed.loc[0]: {sr_mixed.loc[0]}")  # 标签0

# 使用iloc访问位置
print("\n使用iloc:")
print(f"sr_mixed.iloc[0]: {sr_mixed.iloc[0]}")  # 第0个位置
print(f"sr_mixed.iloc[1]: {sr_mixed.iloc[1]}")  # 第1个位置
```

### 索引选择指南

| 场景 | 推荐方法 | 示例 |
|------|----------|------|
| 访问标签 | `loc[]` | `df.loc['row_label']` |
| 访问位置 | `iloc[]` | `df.iloc[0]` |
| 标签切片 | `loc[]` | `df.loc['a':'c']` |
| 位置切片 | `iloc[]` | `df.iloc[0:3]` |
| 布尔索引 | `loc[]` | `df.loc[df['col'] > 0]` |

## Series 数据对齐

Pandas 在运算时会按索引进行自动对齐，这是 Pandas 的核心特性之一。如果存在不同的索引，则结果的索引是两个操作数索引的并集。

### 自动数据对齐示例

```python
# 创建两个不同索引的Series
sr1 = pd.Series([12, 23, 34], index=['c', 'a', 'd'])
sr2 = pd.Series([11, 20, 10], index=['d', 'c', 'a'])

print("Series 1:")
print(sr1)
print("\nSeries 2:")
print(sr2)

# 相加运算（自动对齐）
result = sr1 + sr2
print("\n自动对齐相加结果:")
print(result)

# 第三个Series（包含新索引）
sr3 = pd.Series([11, 20, 10, 14], index=['d', 'c', 'a', 'b'])
print("\nSeries 3:")
print(sr3)

result2 = sr1 + sr3
print("\n包含新索引的对齐结果:")
print(result2)
```

### 灵活的算术方法

```python
# 创建示例Series
sr1 = pd.Series([10, 20, 30], index=['a', 'b', 'c'])
sr2 = pd.Series([5, 15, 25, 35], index=['a', 'c', 'd', 'e'])

print("Series 1:")
print(sr1)
print("\nSeries 2:")
print(sr2)

# 使用fill_value参数处理缺失值
print("\n使用fill_value=0的加法:")
print(sr1.add(sr2, fill_value=0))

print("\n使用fill_value=0的减法:")
print(sr1.sub(sr2, fill_value=0))

print("\n使用fill_value=0的乘法:")
print(sr1.mul(sr2, fill_value=1))

print("\n使用fill_value=0的除法:")
print(sr1.div(sr2, fill_value=1))
```

### 算术方法对比

| 方法 | 描述 | fill_value 默认值 |
|------|------|------------------|
| `add()` | 加法 | 0 |
| `sub()` | 减法 | 0 |
| `mul()` | 乘法 | 1 |
| `div()` | 除法 | 1 |
| `pow()` | 幂运算 | 1 |
| `mod()` | 取模 | 0 |

### 实际应用示例

```python
# 销售数据示例
sales_q1 = pd.Series([1000, 1500, 800], index=['A', 'B', 'C'])
sales_q2 = pd.Series([1200, 900, 1100, 600], index=['A', 'B', 'C', 'D'])

print("Q1销售:")
print(sales_q1)
print("\nQ2销售:")
print(sales_q2)

# 计算总销售额
print("\n总销售额:")
total_sales = sales_q1.add(sales_q2, fill_value=0)
print(total_sales)

# 计算增长率
print("\nQ2相对Q1的增长率:")
growth_rate = sales_q2.div(sales_q1, fill_value=1) - 1
print(growth_rate)

# 计算平均销售额
print("\n平均销售额:")
average_sales = sales_q1.add(sales_q2, fill_value=0) / 2
print(average_sales)
```

## Series 缺失数据处理

缺失数据是数据分析中的常见问题，Pandas 提供了强大的缺失值处理功能。

### 缺失数据表示

```python
# 创建包含缺失数据的Series
sr_with_nan = pd.Series([1, 2, np.nan, 4, None, 6, np.inf, -np.inf])
print("包含缺失数据的Series:")
print(sr_with_nan)

print("\n数据类型:")
print(sr_with_nan.dtype)

print("\n缺失值类型:")
print(f"np.nan: {np.nan}")
print(f"None: {None}")
print(f"np.inf: {np.inf}")
print(f"-np.inf: {-np.inf}")

# 注意：np.nan不等于自身
print(f"\nnp.nan == np.nan: {np.nan == np.nan}")
print(f"np.nan is np.nan: {np.nan is np.nan}")
```

### 缺失值检测

```python
# 创建示例Series
sr = pd.Series([1, 2, np.nan, 4, None, 6])

print("原Series:")
print(sr)

# 检测缺失值
print("\n缺失值检测:")
print(f"isnull(): {sr.isnull()}")
print(f"isna(): {sr.isna()}")
print(f"notnull(): {sr.notnull()}")
print(f"notna(): {sr.notna()}")

# 统计缺失值
print("\n缺失值统计:")
print(f"缺失值数量: {sr.isnull().sum()}")
print(f"非缺失值数量: {sr.notnull().sum()}")
print(f"总数量: {len(sr)}")
print(f"缺失值比例: {sr.isnull().sum() / len(sr):.2%}")
```

### 缺失值删除

```python
# 创建示例Series
sr = pd.Series([1, 2, np.nan, 4, None, 6, np.nan, 8])

print("原Series:")
print(sr)

# 删除缺失值
print("\n删除缺失值:")
print(sr.dropna())

# 使用布尔索引删除缺失值
print("\n使用布尔索引删除缺失值:")
print(sr[sr.notnull()])

# 删除特定值
print("\n删除特定值:")
print(sr.drop(labels=[0, 2]))  # 删除索引为0和2的值
```

### 缺失值填充

```python
# 创建示例Series
sr = pd.Series([1, 2, np.nan, 4, None, 6, np.nan, 8])

print("原Series:")
print(sr)

# 常用填充方法
print("\n填充为0:")
print(sr.fillna(0))

print("\n填充为特定值:")
print(sr.fillna(-999))

# 使用前值填充
print("\n使用前值填充:")
print(sr.fillna(method='ffill'))

# 使用后值填充
print("\n使用后值填充:")
print(sr.fillna(method='bfill'))

# 使用均值填充
print("\n使用均值填充:")
mean_value = sr.mean()
print(f"均值: {mean_value}")
print(sr.fillna(mean_value))

# 使用中位数填充
print("\n使用中位数填充:")
median_value = sr.median()
print(f"中位数: {median_value}")
print(sr.fillna(median_value))

# 限制填充数量
print("\n限制填充数量:")
print(sr.fillna(method='ffill', limit=1))
```

### 高级缺失值处理

```python
# 创建示例Series
sr = pd.Series([1, 2, np.nan, 4, np.nan, np.nan, 7, 8])

print("原Series:")
print(sr)

# 插值填充
print("\n线性插值:")
print(sr.interpolate())

print("\n多项式插值:")
print(sr.interpolate(method='polynomial', order=2))

# 基于时间的插值（时间序列）
dates = pd.date_range('20230101', periods=8)
sr_time = pd.Series([1, 2, np.nan, 4, np.nan, np.nan, 7, 8], index=dates)
print("\n时间序列插值:")
print(sr_time.interpolate(method='time'))
```

## DataFrame 数据结构

DataFrame 是一个表格型的数据结构，含有一组有序的列。DataFrame 可以被看做是由 Series 组成的字典，并且共用一个索引。它是 Pandas 中最重要的数据结构。

### 创建 DataFrame

```python
import pandas as pd
import numpy as np

# 方式1：从字典创建（推荐）
df1 = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, 30, 35, 28],
    'city': ['New York', 'London', 'Paris', 'Tokyo']
})
print("从字典创建:")
print(df1)

# 方式2：从列表的字典创建
df2 = pd.DataFrame([
    {'name': 'Alice', 'age': 25, 'city': 'New York'},
    {'name': 'Bob', 'age': 30, 'city': 'London'},
    {'name': 'Charlie', 'age': 35, 'city': 'Paris'}
])
print("\n从列表的字典创建:")
print(df2)

# 方式3：从Series创建
df3 = pd.DataFrame({
    'math': pd.Series([90, 85, 78, 92], index=['Alice', 'Bob', 'Charlie', 'David']),
    'english': pd.Series([88, 92, 85, 79], index=['Alice', 'Bob', 'Charlie', 'Eve'])
})
print("\n从Series创建:")
print(df3)

# 方式4：从NumPy数组创建
data = np.random.randn(5, 3)
df4 = pd.DataFrame(data, columns=['A', 'B', 'C'], index=['row1', 'row2', 'row3', 'row4', 'row5'])
print("\n从NumPy数组创建:")
print(df4)

# 方式5：创建时间序列索引的DataFrame
dates = pd.date_range('20230101', periods=5)
df5 = pd.DataFrame(np.random.randn(5, 4), index=dates, columns=['Open', 'High', 'Low', 'Close'])
print("\n时间序列DataFrame:")
print(df5)
```

### DataFrame 属性

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35],
    'salary': [50000, 60000, 70000]
}, index=['emp1', 'emp2', 'emp3'])

print("DataFrame:")
print(df)

print("\n基本属性:")
print(f"形状: {df.shape}")
print(f"维度: {df.ndim}")
print(f"大小: {df.size}")
print(f"索引: {df.index}")
print(f"列名: {df.columns}")
print(f"数据类型: {df.dtypes}")
print(f"值数组类型: {type(df.values)}")

# 转置
print("\n转置:")
print(df.T)
```

### 基本文件操作

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'date': pd.date_range('20230101', periods=5),
    'product': ['A', 'B', 'C', 'D', 'E'],
    'sales': [100, 150, 120, 180, 200],
    'price': [10.5, 15.2, 12.8, 18.5, 20.0]
})

print("示例DataFrame:")
print(df)

# 写入CSV
print("\n写入CSV文件...")
df.to_csv('sales_data.csv', index=False)
print("CSV文件已保存")

# 读取CSV
print("\n从CSV文件读取:")
df_loaded = pd.read_csv('sales_data.csv')
print(df_loaded)

# 写入Excel
print("\n写入Excel文件...")
df.to_excel('sales_data.xlsx', index=False)
print("Excel文件已保存")

# 读取Excel
print("\n从Excel文件读取:")
df_excel = pd.read_excel('sales_data.xlsx')
print(df_excel)
```

### DataFrame 数据查看

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'age': [25, 30, 35, 28, 32],
    'salary': [50000, 60000, 70000, 55000, 65000],
    'department': ['IT', 'HR', 'Finance', 'IT', 'Marketing']
})

print("完整DataFrame:")
print(df)

# 查看数据基本信息
print("\n基本信息:")
print(f"形状: {df.shape}")
print(f"列名: {list(df.columns)}")
print(f"索引: {list(df.index)}")
print(f"数据类型:")
print(df.dtypes)

# 查看前几行和后几行
print("\n前3行:")
print(df.head(3))

print("\n后2行:")
print(df.tail(2))

# 随机抽样
print("\n随机2行:")
print(df.sample(2))

# 描述性统计
print("\n描述性统计:")
print(df.describe())

# 非数值列的统计
print("\n非数值列统计:")
print(df.describe(include=['object']))

# 所有列的统计
print("\n所有列统计:")
print(df.describe(include='all'))
```

### 列名操作

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'first_name': ['Alice', 'Bob', 'Charlie'],
    'last_name': ['Smith', 'Johnson', 'Brown'],
    'age': [25, 30, 35]
})

print("原DataFrame:")
print(df)

# 获取列名
print("\n列名:")
print(list(df.columns))

# 重命名列名
print("\n重命名列名:")
df_renamed = df.rename(columns={
    'first_name': 'name',
    'last_name': 'surname',
    'age': 'years'
})
print(df_renamed)

# 批量重命名（使用函数）
print("\n批量重命名（转大写）:")
df_upper = df.rename(columns=str.upper)
print(df_upper)

# 直接修改列名
print("\n直接修改列名:")
df.columns = ['Name', 'Surname', 'Age']
print(df)

# 添加列前缀或后缀
print("\n添加列前缀:")
df_prefixed = df.add_prefix('col_')
print(df_prefixed)

print("\n添加列后缀:")
df_suffixed = df.add_suffix('_data')
print(df_suffixed)
```

### 数据选择与访问

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'age': [25, 30, 35, 28],
    'salary': [50000, 60000, 70000, 55000],
    'department': ['IT', 'HR', 'Finance', 'IT']
}, index=['emp1', 'emp2', 'emp3', 'emp4'])

print("原DataFrame:")
print(df)

# 选择单列
print("\n选择单列（返回Series）:")
print(df['name'])
print(df.name)  # 属性访问方式

# 选择多列
print("\n选择多列（返回DataFrame）:")
print(df[['name', 'salary']])

# 选择行
print("\n选择行（按索引）:")
print(df.loc['emp2'])  # 单行
print(df.loc[['emp1', 'emp3']])  # 多行

print("\n选择行（按位置）:")
print(df.iloc[1])  # 第2行
print(df.iloc[[0, 2]])  # 第1行和第3行

# 行列同时选择
print("\n行列同时选择（loc）:")
print(df.loc['emp2', 'salary'])  # 单个值
print(df.loc[['emp1', 'emp3'], ['name', 'salary']])  # 多行多列

print("\n行列同时选择（iloc）:")
print(df.iloc[1, 2])  # 单个值
print(df.iloc[[0, 2], [0, 2]])  # 多行多列
```

## DataFrame 索引与切片

DataFrame 有行索引和列索引，可以通过标签和位置两种方法进行索引和切片。掌握 `loc` 和 `iloc` 的使用是高效操作 DataFrame 的关键。

### 索引方法对比

| 方法 | 说明 | 推荐场景 |
|------|------|----------|
| `df['col']` | 单列选择（返回Series） | 快速访问单列 |
| `df[['col1', 'col2']]` | 多列选择（返回DataFrame） | 选择多个列 |
| `df.loc[]` | 基于标签索引 | 知道标签名称时使用 |
| `df.iloc[]` | 基于位置索引 | 知道位置时使用 |
| `df.at[]` | 基于标签的单值访问 | 快速访问单个值 |
| `df.iat[]` | 基于位置的单值访问 | 快速访问单个值 |

### 创建示例数据

```python
# 创建示例DataFrame
dates = pd.date_range('20230101', periods=6)
df = pd.DataFrame({
    'open': [100, 102, 101, 103, 105, 104],
    'high': [105, 106, 104, 107, 108, 106],
    'low': [98, 99, 97, 100, 102, 101],
    'close': [102, 101, 103, 105, 104, 105],
    'volume': [1000, 1200, 800, 1500, 1100, 900]
}, index=dates)

print("示例DataFrame:")
print(df)
```

### loc - 基于标签的索引

```python
# 选择行
print("\n选择单行（loc）:")
print(df.loc['2023-01-01'])

print("\n选择多行（loc）:")
print(df.loc['2023-01-01':'2023-01-03'])

# 选择列
print("\n选择单列（loc）:")
print(df.loc[:, 'open'])

print("\n选择多列（loc）:")
print(df.loc[:, ['open', 'close']])

# 行列同时选择
print("\n行列同时选择（loc）:")
print(df.loc['2023-01-01', 'open'])  # 单个值
print(df.loc['2023-01-01':'2023-01-03', ['open', 'close']])  # 多行多列
```

### iloc - 基于位置的索引

```python
# 选择行
print("\n选择单行（iloc）:")
print(df.iloc[0])

print("\n选择多行（iloc）:")
print(df.iloc[0:3])  # 位置0到2（不包含3）

# 选择列
print("\n选择单列（iloc）:")
print(df.iloc[:, 0])

print("\n选择多列（iloc）:")
print(df.iloc[:, [0, 3]])

# 行列同时选择
print("\n行列同时选择（iloc）:")
print(df.iloc[0, 0])  # 单个值
print(df.iloc[0:3, [0, 3]])  # 多行多列
```

### at 和 iat - 快速单值访问

```python
# at - 基于标签的单值访问（最快）
print("\nat - 单值访问:")
print(df.at['2023-01-01', 'open'])

# iat - 基于位置的单值访问（最快）
print("\niat - 单值访问:")
print(df.iloc[0, 0])
```

## DataFrame 数据操作

### 添加和删除列

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35]
})

print("原DataFrame:")
print(df)

# 添加新列
df['city'] = ['New York', 'London', 'Paris']
print("\n添加新列后:")
print(df)

# 添加计算列
df['age_plus_10'] = df['age'] + 10
print("\n添加计算列后:")
print(df)

# 删除列
df_deleted = df.drop(columns=['age_plus_10'])
print("\n删除列后:")
print(df_deleted)

# 使用del删除（原地删除）
df_copy = df.copy()
del df_copy['city']
print("\n使用del删除后:")
print(df_copy)
```

### 修改单元格值

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35]
})

print("原DataFrame:")
print(df)

# 修改单个值
df.loc[0, 'age'] = 26
print("\n修改单个值后:")
print(df)

# 修改多行一列
df.loc[0:1, 'age'] = [27, 31]
print("\n修改多行一列后:")
print(df)

# 使用条件修改
df.loc[df['age'] > 30, 'age'] = 40
print("\n使用条件修改后:")
print(df)
```

### 排序

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Charlie', 'Alice', 'Bob'],
    'age': [35, 25, 30],
    'score': [85, 92, 78]
})

print("原DataFrame:")
print(df)

# 按单列排序
print("\n按age升序排序:")
print(df.sort_values('age'))

print("\n按age降序排序:")
print(df.sort_values('age', ascending=False))

# 按多列排序
print("\n先按age升序，再按score降序:")
print(df.sort_values(['age', 'score'], ascending=[True, False]))

# 按索引排序
print("\n按索引排序:")
print(df.sort_index())

# 原地排序
df_sorted = df.sort_values('age', inplace=False)
print("\n原地排序（inplace=False）:")
print(df_sorted)
```

### 排名

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David'],
    'score': [92, 85, 92, 78]
})

print("原DataFrame:")
print(df)

# 默认排名（method='average'）
print("\n默认排名:")
print(df['rank'] = df['score'].rank())

# method='min' - 最小排名
print("\n最小排名:")
print(df['rank_min'] = df['score'].rank(method='min'))

# method='dense' - 紧凑排名
print("\n紧凑排名:")
print(df['rank_dense'] = df['score'].rank(method='dense'))
```

## 数据清洗

### 处理重复数据

```python
# 创建包含重复数据的DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Alice', 'Charlie', 'Bob'],
    'age': [25, 30, 25, 35, 30]
})

print("原DataFrame:")
print(df)

# 检测重复行
print("\n检测重复行:")
print(df.duplicated())

# 删除重复行
print("\n删除重复行:")
print(df.drop_duplicates())

# 按列删除重复行
print("\n按name列删除重复行:")
print(df.drop_duplicates(subset=['name']))

# 保留最后一个
print("\n保留最后一个重复:")
print(df.drop_duplicates(keep='last'))
```

### 处理缺失数据

```python
# 创建包含缺失数据的DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', None, 'David', 'Eve'],
    'age': [25, None, 35, None, 32],
    'salary': [50000, 60000, None, 55000, None]
})

print("原DataFrame:")
print(df)

# 检测缺失值
print("\n检测缺失值:")
print(df.isnull())

# 删除缺失值
print("\n删除包含缺失值的行:")
print(df.dropna())

print("\n删除全是缺失值的列:")
print(df.dropna(axis=1, how='all'))

print("\n删除超过2个缺失值的行:")
print(df.dropna(thresh=2))

# 填充缺失值
print("\n填充为0:")
print(df.fillna(0))

print("\n使用均值填充:")
df_filled = df.copy()
df_filled['age'].fillna(df_filled['age'].mean(), inplace=True)
print(df_filled)

print("\n使用前值填充:")
print(df.fillna(method='ffill'))

print("\n使用后值填充:")
print(df.fillna(method='bfill'))
```

### 替换值

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35]
})

print("原DataFrame:")
print(df)

# 替换单个值
print("\n替换单个值:")
print(df.replace(25, 26))

# 替换多个值
print("\n替换多个值:")
print(df.replace({25: 26, 30: 31}))

# 使用字典替换
print("\n使用字典替换:")
print(df.replace({'age': {25: 26, 30: 31}}))
```

### 数据类型转换

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': ['25', '30', '35'],  # 字符串类型
    'score': ['92.5', '85.0', '78.5']  # 字符串类型
})

print("原数据类型:")
print(df.dtypes)

# 转换数据类型
df['age'] = df['age'].astype(int)
df['score'] = df['score'].astype(float)
print("\n转换后数据类型:")
print(df.dtypes)

# 使用astype的safe参数处理转换错误
df_with_na = pd.DataFrame({
    'value': ['25', '30', 'abc', '35']
})
print("\n带缺失值的转换:")
df_with_na['value'] = pd.to_numeric(df_with_na['value'], errors='coerce')
print(df_with_na)
```

## 数据统计与分析

### 基本统计

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'age': [25, 30, 35, 28, 32],
    'salary': [50000, 60000, 70000, 55000, 65000],
    'department': ['IT', 'HR', 'Finance', 'IT', 'Marketing']
})

print("DataFrame:")
print(df)

# 基本统计
print("\n数值列统计:")
print(df.describe())

print("\n所有列统计:")
print(df.describe(include='all'))

# 相关性
print("\n相关性:")
print(df[['age', 'salary']].corr())
```

### 分组统计

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'department': ['IT', 'HR', 'IT', 'HR', 'IT'],
    'salary': [50000, 60000, 70000, 55000, 65000]
})

print("原DataFrame:")
print(df)

# 按单列分组
print("\n按department分组:")
grouped = df.groupby('department')
print(grouped.groups)

# 分组后求和
print("\n按department分组求和:")
print(df.groupby('department').sum())

# 分组后统计多个指标
print("\n按department分组统计:")
print(df.groupby('department').agg({
    'salary': ['sum', 'mean', 'min', 'max', 'count']
}))
```

### 透视表

```python
# 创建示例DataFrame
df = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'],
    'department': ['IT', 'HR', 'IT', 'HR', 'IT', 'HR'],
    'year': [2023, 2023, 2023, 2024, 2024, 2024],
    'salary': [50000, 60000, 70000, 55000, 65000, 62000]
})

print("原DataFrame:")
print(df)

# 创建透视表
print("\n透视表（按department和year）:")
pivot = pd.pivot_table(df, values='salary', index='department', columns='year', aggfunc='mean')
print(pivot)

# 多指标透视表
print("\n多指标透视表:")
pivot_multi = pd.pivot_table(df, values='salary', index='department', columns='year', aggfunc=['sum', 'mean'])
print(pivot_multi)
```

## 数据合并

### concat 合并

```python
# 创建示例DataFrame
df1 = pd.DataFrame({
    'name': ['Alice', 'Bob'],
    'age': [25, 30]
})
df2 = pd.DataFrame({
    'name': ['Charlie', 'David'],
    'age': [35, 28]
})

print("DataFrame 1:")
print(df1)
print("\nDataFrame 2:")
print(df2)

# 垂直合并
print("\n垂直合并:")
print(pd.concat([df1, df2]))

# 水平合并
df3 = pd.DataFrame({
    'city': ['New York', 'London']
})
print("\n水平合并:")
print(pd.concat([df1, df3], axis=1))
```

### merge 合并

```python
# 创建示例DataFrame
df1 = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'department_id': [1, 2, 1]
})
df2 = pd.DataFrame({
    'department_id': [1, 2],
    'department_name': ['IT', 'HR']
})

print("DataFrame 1:")
print(df1)
print("\nDataFrame 2:")
print(df2)

# 内连接
print("\n内连接:")
print(pd.merge(df1, df2, on='department_id'))

# 左连接
print("\n左连接:")
print(pd.merge(df1, df2, on='department_id', how='left'))
```

### join 合并

```python
# 创建示例DataFrame
df1 = pd.DataFrame({
    'name': ['Alice', 'Bob', 'Charlie'],
    'age': [25, 30, 35]
}, index=['a', 'b', 'c'])
df2 = pd.DataFrame({
    'city': ['New York', 'London', 'Paris']
}, index=['a', 'b', 'c'])

print("DataFrame 1:")
print(df1)
print("\nDataFrame 2:")
print(df2)

# 使用join合并
print("\n使用join合并:")
print(df1.join(df2))
```

## 时间序列

### 创建时间序列

```python
import pandas as pd
import numpy as np

# date_range - 日期范围
dates = pd.date_range('2023-01-01', periods=10, freq='D')
print("日期范围:")
print(dates)

# 时间序列DataFrame
ts = pd.Series(np.random.randn(10), index=dates)
print("\n时间序列:")
print(ts)
```

### 时间索引操作

```python
# 创建时间序列DataFrame
df = pd.DataFrame({
    'value': [1, 2, 3, 4, 5]
}, index=pd.date_range('2023-01-01', periods=5, freq='D'))

print("原DataFrame:")
print(df)

# 按年访问
print("\n按年访问:")
print(df['2023'])

# 按月访问
print("\n按月访问:")
print(df['2023-01'])

# 时间切片
print("\n时间切片:")
print(df['2023-01-02':'2023-01-04'])
```

### 重采样

```python
# 创建示例时间序列
dates = pd.date_range('2023-01-01', periods=10, freq='D')
ts = pd.Series(range(10), index=dates)

print("原时间序列:")
print(ts)

# 按周重采样
print("\n按周重采样（求和）:")
print(ts.resample('W').sum())

# 按月重采样
print("\n按月重采样（均值）:")
print(ts.resample('M').mean())

# 移动窗口
print("\n移动窗口（3天均值）:")
print(ts.rolling(window=3).mean())
```

---