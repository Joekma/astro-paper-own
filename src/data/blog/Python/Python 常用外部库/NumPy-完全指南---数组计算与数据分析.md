---
title: NumPy 完全指南 - 数组计算与数据分析
author: FjellOverflow
pubDatetime: 2024-08-13T00:00:00Z
modDatetime: 2026-04-22T00:00:00Z
featured: false
draft: false
tags:
  - Python
  - NumPy
  - docs
description: NumPy 完全指南，涵盖 ndarray 数据结构、数组创建、索引切片、通用函数等核心内容。
---

# NumPy 完全指南 - 数组计算与数据分析

## 简介

NumPy（Numerical Python）是高性能科学计算和数据分析的基础包。它是 Pandas 等其他各种工具的基础，为 Python 提供了强大的多维数组对象和用于处理这些数组的工具。

### 核心特性

- **高性能计算**：基于 C 语言实现，运算速度远超纯 Python 代码
- **内存效率**：ndarray 对象比 Python 列表更节省内存
- **向量化运算**：无需循环即可对整组数据进行快速运算
- **广播机制**：自动处理不同形状数组之间的运算
- **丰富的函数库**：提供大量数学、统计和线性代数函数
- **集成工具**：用于集成 C、C++ 等代码的工具

### 应用场景

- **科学研究**：物理、化学、生物等科学计算
- **数据分析**：金融数据、统计分析、机器学习
- **图像处理**：计算机视觉、图像识别
- **游戏开发**：物理引擎、图形渲染
- **网络数据**：日志分析、用户行为挖掘
- **金融建模**：期权定价、风险分析、量化交易

## 安装与配置

### 安装 NumPy

```bash
# 使用 pip 安装
pip install numpy

# 使用 conda 安装
conda install numpy

# 安装特定版本
pip install numpy==1.24.3

# 安装最新开发版
pip install numpy --pre
```

### 依赖包安装

```bash
# 安装常用依赖包
pip install numpy scipy matplotlib pandas

# 完整科学计算环境
pip install numpy scipy matplotlib pandas jupyter
```

### 导入与配置

```python
import numpy as np

# 检查版本
print(f"NumPy version: {np.__version__}")

# 设置打印选项
np.set_printoptions(precision=4, suppress=True)  # 设置小数位数
np.set_printoptions(threshold=100)  # 设置打印阈值

# 常用配置
printoptions = {
    'precision': 4,      # 小数位数
    'suppress': True,    # 抑制科学计数法
    'linewidth': 100,    # 行宽
    'edgeitems': 3       # 边缘元素数量
}
np.set_printoptions(**printoptions)
```

### 最佳实践

```python
# 标准引用方式（推荐）
import numpy as np

# 避免使用
import numpy  # 不推荐，每次都要写 numpy.
from numpy import *  # 不推荐，会污染命名空间
```

> **最佳实践**：始终使用 `import numpy as np` 作为标准引用方式，这样可以保持代码的一致性和可读性。

## ndarray 数据结构

ndarray（N-dimensional array）是 NumPy 的核心数据结构，它是一个快速、灵活的同构多维数据容器。

### 创建 ndarray

#### 基本创建方法

```python
import numpy as np

# 从列表创建
arr1 = np.array([1, 2, 3, 4, 5])
print("从列表创建:")
print(arr1)

# 从嵌套列表创建二维数组
arr2 = np.array([[1, 2, 3], [4, 5, 6]])
print("\n从嵌套列表创建二维数组:")
print(arr2)

# 指定数据类型
arr3 = np.array([1, 2, 3], dtype=np.float64)
print("\n指定数据类型:")
print(arr3)
print(f"数据类型: {arr3.dtype}")
```

### ndarray 与列表的区别

| 特性 | ndarray | Python 列表 |
|------|---------|-------------|
| **元素类型** | 必须相同（同构） | 可以不同（异构） |
| **大小修改** | 不可修改 | 可以动态修改 |
| **内存效率** | 高（连续内存） | 低（分散存储） |
| **运算速度** | 快（向量化） | 慢（需要循环） |
| **功能** | 丰富的数学运算 | 基本的数据存储 |

### ndarray 常用属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `T` | 数组的转置（对高维数组而言） | `arr.T` |
| `dtype` | 数组元素的数据类型 | `arr.dtype` |
| `size` | 数组元素的个数 | `arr.size` |
| `ndim` | 数组的维数 | `arr.ndim` |
| `shape` | 数组的维度大小（以元组形式） | `arr.shape` |
| `nbytes` | 数组占用的字节数 | `arr.nbytes` |

#### 属性使用示例

```python
import numpy as np

arr = np.array([[1, 2, 3], [4, 5, 6]])

print("示例数组:")
print(arr)

print("\n基本属性:")
print(f"形状: {arr.shape}")        # (2, 3)
print(f"维数: {arr.ndim}")         # 2
print(f"数据类型: {arr.dtype}")   # int32
print(f"元素个数: {arr.size}")     # 6
print(f"字节数: {arr.nbytes}")     # 24

print("\n转置:")
print(arr.T)
```

### ndarray 常用方法速查

| 方法/函数 | 说明 |
|-----------|------|
| **数组创建** | |
| `np.zeros(dim1, dim2)` | 创建 dim1×dim2 的零矩阵 |
| `np.ones(shape)` | 创建指定形状的全1数组 |
| `np.empty(shape)` | 创建未初始化的数组（随机值） |
| `np.arange(start, stop, step)` | 类似 range 的 NumPy 版本 |
| `np.linspace(start, stop, num)` | 创建等间距数组 |
| `np.eye(n)` / `np.identity(n)` | 创建 n×n 单位矩阵 |
| **类型转换** | |
| `np.array([...], dtype=float64)` | 创建指定数据类型的数组 |
| `arr.astype(np.float64)` | 更换数组的数据类型 |
| `arr.astype(float)` | 更换数组的数据类型 |
| **数组操作** | |
| `arr.reshape(a, b)` | 将数组重塑为 a×b 的形式 |
| `arr.copy()` | 得到 ndarray 的副本，而不是视图 |
| `arr.T` | 数组的转置 |
| `arr.transpose((1, 0, 2))` | 对于高维数组，指定轴进行转置 |
| **索引和切片** | |
| `arr[a:b]` | 切片操作 |
| `arr[a][b]` / `arr[a, b]` | 多维索引，两者等价 |
| `arr[-1]` | 获取最后一个元素 |
| `arr[[4, 3, 0, 6]]` | 花式索引，将指定位置的元素取出 |
| **布尔索引** | |
| `name == 'bob'` | 布尔比较，返回布尔数组 |
| `data[bool_array]` | 布尔索引，只取为 True 的部分 |
| **数学运算** | |
| `arr * arr` | 元素级乘法（点乘） |
| `np.dot(matrix1, matrix2)` | 矩阵乘法 |
| **随机数** | |
| `np.random.randn(a, b)` | 生成 a×b 的标准正态分布随机数组 |
| `np.random.shuffle(arr)` | 原地打乱数组顺序 |

### 花式索引高级用法

```python
import numpy as np

arr = np.array([[1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12]])

print("示例数组:")
print(arr)

# 使用 np.ix_ 创建矩形索引
# 等价于 arr[[0, 2]][:, [1, 3]]
result = arr[np.ix_([0, 2], [1, 3])]
print("\n使用 np.ix_ 选择矩形区域:")
print(result)
# 结果：[[2, 4], [10, 12]]
```

## 数据类型

### ndarray 数据类型 dtype

NumPy 支持比 Python 更丰富的数据类型，这些数据类型都是为了高效存储和计算而设计的。

| 类型类别 | 类型代码 | 说明 | 字节数 |
|----------|----------|------|--------|
| **布尔型** | `bool_` | 布尔值（True/False） | 1 |
| **整型** | `int8` | 8位有符号整数（-128 到 127） | 1 |
| | `int16` | 16位有符号整数 | 2 |
| | `int32` | 32位有符号整数 | 4 |
| | `int64` | 64位有符号整数 | 8 |
| | `int_` | 默认整数类型（通常为 int64） | - |
| **无符号整型** | `uint8` | 8位无符号整数（0 到 255） | 1 |
| | `uint16` | 16位无符号整数 | 2 |
| | `uint32` | 32位无符号整数 | 4 |
| | `uint64` | 64位无符号整数 | 8 |
| **浮点型** | `float16` | 半精度浮点数 | 2 |
| | `float32` | 单精度浮点数 | 4 |
| | `float64` | 双精度浮点数 | 8 |
| | `float_` | 默认浮点类型（通常为 float64） | - |
| **复数型** | `complex64` | 32位浮点数的复数 | 8 |
| | `complex128` | 64位浮点数的复数 | 16 |
| | `complex_` | 默认复数类型 | - |
| **字符串型** | `str_` | 字符串类型 | - |
| **对象型** | `object_` | Python对象 | - |

### 数据类型使用示例

```python
import numpy as np

# 创建不同数据类型的数组
arr_int = np.array([1, 2, 3], dtype=np.int32)
arr_float = np.array([1.0, 2.0, 3.0], dtype=np.float64)
arr_bool = np.array([True, False, True], dtype=bool)

# 查看数据类型
print(arr_int.dtype)    # int32
print(arr_float.dtype)  # float64
print(arr_bool.dtype)   # bool

# 类型转换
arr = np.array([1.5, 2.7, 3.9])
arr_int = arr.astype(int)  # [1, 2, 3]
```

## 数组创建

### 创建 ndarray 的函数

NumPy 提供了多种创建数组的函数，可以根据不同的需求选择合适的方法。

| 函数 | 说明 | 示例 |
|------|------|------|
| `array()` | 将列表转换为数组，可选择显式指定 dtype | `np.array([1, 2, 3])` |
| `arange()` | range 的 NumPy 版，支持浮点数 | `np.arange(0, 10, 2)` |
| `linspace()` | 创建等间距数组，第三个参数为数组长度 | `np.linspace(0, 10, 5)` |
| `zeros()` | 根据指定形状和 dtype 创建全 0 数组 | `np.zeros((3, 4))` |
| `ones()` | 根据指定形状和 dtype 创建全 1 数组 | `np.ones((2, 3))` |
| `empty()` | 根据指定形状和 dtype 创建空数组（随机值） | `np.empty((2, 3))` |
| `eye()` | 根据指定边长和 dtype 创建单位矩阵 | `np.eye(3)` |
| `identity()` | 创建单位矩阵（与 eye 类似） | `np.identity(3)` |
| `full()` | 用指定值填充数组 | `np.full((2, 3), 7)` |
| `zeros_like()` | 创建与给定数组形状相同的全 0 数组 | `np.zeros_like(arr)` |
| `ones_like()` | 创建与给定数组形状相同的全 1 数组 | `np.ones_like(arr)` |

### 创建函数使用示例

```python
import numpy as np

# 1. array() - 从列表创建
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([[1, 2, 3], [4, 5, 6]])

# 2. arange() - 类似 range，但支持浮点数
arr3 = np.arange(0, 10, 2)      # [0, 2, 4, 6, 8]
arr4 = np.arange(0, 1, 0.1)    # [0., 0.1, 0.2, ..., 0.9]

# 3. linspace() - 创建等间距数组
arr5 = np.linspace(0, 10, 5)    # [0., 2.5, 5., 7.5, 10.]

# 4. zeros() - 创建全 0 数组
arr6 = np.zeros((3, 4))         # 3行4列的全0数组

# 5. ones() - 创建全 1 数组
arr7 = np.ones((2, 3))          # 2行3列的全1数组

# 6. empty() - 创建未初始化数组（值是随机的）
arr8 = np.empty((2, 3))

# 7. eye() - 创建单位矩阵
arr9 = np.eye(3)                # 3x3 单位矩阵
# 结果：
# [[1. 0. 0.]
#  [0. 1. 0.]
#  [0. 0. 1.]]

# 8. full() - 用指定值填充
arr10 = np.full((2, 3), 7)      # 2行3列，全为7
```

## 索引与切片

### 数组运算

#### 1. 数组和标量之间的运算（广播）

NumPy 支持数组与标量之间的运算，这称为广播。标量会自动与数组的每个元素进行运算。

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])

a + 1       # 每个元素加1：[2, 3, 4, 5, 6]
a * 3       # 每个元素乘3：[3, 6, 9, 12, 15]
1 // a      # 整数除法：[1, 0, 0, 0, 0]
a ** 0.5    # 每个元素开平方根：[1., 1.414, 1.732, 2., 2.236]
```

#### 2. 同样大小数组之间的运算

相同形状的数组之间进行元素级运算。

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
b = np.array([10, 20, 30, 40, 50])

a + b       # 元素级加法：[11, 22, 33, 44, 55]
a / b       # 元素级除法：[0.1, 0.1, 0.1, 0.1, 0.1]
a ** b      # 元素级幂运算：[1, 1048576, ...]
```

### 数组索引

#### 一维数组索引

```python
import numpy as np

a = np.array([10, 20, 30, 40, 50])

a[0]        # 获取第一个元素：10
a[2]        # 获取索引为2的元素：30
a[-1]       # 获取最后一个元素：50
a[-2]       # 获取倒数第二个元素：40
```

#### 多维数组索引

```python
import numpy as np

a = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

# 列表式写法（不推荐）
a[2][1]     # 8

# 新式写法（推荐）
a[2, 1]     # 8

# 获取整行
a[0]        # [1, 2, 3]
a[1]        # [4, 5, 6]
```

### 数组切片

#### 一维数组切片

```python
import numpy as np

a = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

a[5:8]      # 索引5到7的元素：[5, 6, 7]
a[4:]       # 索引4到末尾的元素：[4, 5, 6, 7, 8, 9]
a[:5]       # 索引0到4的元素：[0, 1, 2, 3, 4]
a[::2]      # 每隔一个元素：[0, 2, 4, 6, 8]
a[::-1]     # 反转数组：[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

# 切片赋值
a[2:5] = 100  # 将索引2到4的元素设置为100
```

#### 多维数组切片

```python
import numpy as np

a = np.array([[1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12]])

a[1:2, 3:4]  # 第1行到第2行，第3列到第4列：[[8]]
a[:, 3:5]     # 所有行，第3列到第4列：[[4], [8], [12]]
a[:, 1]       # 所有行，第1列：[2, 6, 10]
a[1:, :2]     # 第1行到末尾，第0列到第1列：[[5, 6], [9, 10]]
a[:2, :]      # 第0行到第1行，所有列：[[1, 2, 3, 4], [5, 6, 7, 8]]
```

### 视图与副本（重要）

#### 数组切片的行为

与 Python 列表不同，NumPy 数组切片时**不会自动复制数据**。切片返回的是原数组的**视图（view）**，对切片的修改会影响原数组。

```python
import numpy as np

a = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
b = a[5:8]        # b 是 a 的视图

b[0] = 100        # 修改 b
print(a)          # a 也被修改：[0, 1, 2, 3, 4, 100, 6, 7, 8, 9]
```

#### 创建副本

如果需要独立修改切片而不影响原数组，使用 `copy()` 方法创建副本。

```python
import numpy as np

a = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
b = a[5:8].copy()  # 创建副本

b[0] = 100        # 修改 b
print(a)          # a 不受影响：[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
print(b)          # b 被修改：[100, 6, 7]
```

> **最佳实践**：当你不确定是否需要副本时，使用 `copy()` 是更安全的选择。

## 布尔型索引

布尔型索引（Boolean Indexing）是一种强大的数据筛选方法，通过布尔表达式来选择数组中的元素。

### 基本概念

**问题**：给定一个数组，选出数组中所有大于 5 的数。

**答案**：`a[a > 5]`

**原理**：

1. `a > 5` 会对数组中的每一个元素进行判断
2. 返回一个与原数组形状相同的布尔数组
3. 将这个布尔数组作为索引，会返回所有 `True` 对应位置的元素

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# 创建布尔数组
bool_mask = a > 5
print(bool_mask)
# 输出：[False False False False False  True  True  True  True  True]

# 使用布尔索引
result = a[a > 5]
print(result)
# 输出：[ 6  7  8  9 10]
```

### 复杂条件

可以使用逻辑运算符组合多个条件：

**问题 2**：选出数组中所有大于 5 的偶数。

**问题 3**：选出数组中所有大于 5 的数或偶数。

**答案**：

```python
a[(a > 5) & (a % 2 == 0)]  # 大于5的偶数（与运算）
a[(a > 5) | (a % 2 == 0)]  # 大于5或偶数（或运算）
```

### 逻辑运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `&` | 与运算（AND） | `a > 5 & a < 10` |
| `\|` | 或运算（OR） | `a > 5 \| a < 2` |
| `~` | 非运算（NOT） | `~(a > 5)` |

### 重要注意事项

#### 运算符优先级

**错误写法**：

```python
a[a > 5 & (a % 2 == 0)]  # 错误！运算符优先级问题
```

**正确写法**：

```python
a[(a > 5) & (a % 2 == 0)]  # 使用括号明确优先级
```

#### 完整示例

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# 基本条件
print(a[a > 5])              # [6, 7, 8, 9, 10]
print(a[a % 2 == 0])        # [2, 4, 6, 8, 10]

# 复合条件
print(a[(a > 5) & (a % 2 == 0)])  # 大于5的偶数：[8, 10]
print(a[(a > 5) | (a % 2 == 0)])  # 大于5或偶数：[2, 4, 6, 7, 8, 9, 10]
print(a[~(a > 5)])                  # 不大于5的数：[1, 2, 3, 4, 5]
```

### 实际应用场景

布尔索引在数据清洗和分析中非常有用：

```python
import numpy as np

# 假设这是某产品的销售数据
sales = np.array([100, 150, 200, 50, 300, 80, 250, 120])

# 找出销售额大于200的产品
high_sales = sales[sales > 200]
print(f"高销售额: {high_sales}")  # [300, 250]

# 找出销售额在100到200之间的产品
mid_sales = sales[(sales >= 100) & (sales <= 200)]
print(f"中等销售额: {mid_sales}")  # [100, 150, 200, 120]

# 找出异常低销售额（低于100）
low_sales = sales[sales < 100]
print(f"低销售额: {low_sales}")  # [50, 80]
```

## 花式索引

花式索引（Fancy Indexing）是指使用整数数组进行索引，可以灵活地选择数组中的特定元素。

### 一维数组花式索引

**问题**：对于一个数组，选出其第 1、3、4、6、7 个元素，组成新的数组。

**答案**：`a[[1, 3, 4, 6, 7]]`

**示例**：

```python
import numpy as np

a = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])

# 选择指定位置的元素
result = a[[1, 3, 4, 6, 7]]
print(result)
# 输出：[20, 40, 50, 70, 80]

# 注意：花式索引返回的是副本，不是视图
result[0] = 999
print(a)  # 原数组不受影响
```

### 二维数组花式索引

**问题**：对一个二维数组，选出其第一列和第三列，组成新的二维数组。

**答案**：`a[:, [1, 3]]`  # 所有行，第1列和第3列

**示例**：

```python
import numpy as np

a = np.array([[1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12]])

# 选择特定列
result = a[:, [1, 3]]
print(result)
# 输出：
# [[ 2  4]
#  [ 6  8]
#  [10 12]]

# 选择特定行
result = a[[0, 2], :]
print(result)
# 输出：
# [[ 1  2  3  4]
#  [ 9 10 11 12]]
```

### 高级花式索引

#### 使用 np.ix_ 进行矩形区域选择

```python
import numpy as np

a = np.array([[1, 2, 3, 4],
              [5, 6, 7, 8],
              [9, 10, 11, 12],
              [13, 14, 15, 16]])

# 选择第0行和第2行，第1列和第3列的交叉区域
result = a[np.ix_([0, 2], [1, 3])]
print(result)
# 输出：
# [[ 2  4]
#  [10 12]]

# 等价于：
result = a[[0, 2]][:, [1, 3]]
```

### 花式索引 vs. 普通切片

| 特性 | 花式索引 | 普通切片 |
|------|----------|----------|
| **索引方式** | 使用整数数组 | 使用冒号和范围 |
| **返回结果** | 副本（copy） | 视图（view） |
| **修改影响** | 不影响原数组 | 影响原数组 |
| **灵活性** | 可以选择任意位置 | 只能选择连续区域 |

```python
import numpy as np

a = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])

# 花式索引 - 返回副本
fancy = a[[1, 3, 5]]
fancy[0] = 999
print(a)  # 原数组不变

# 普通切片 - 返回视图
slice_ = a[1:6:2]
slice_[0] = 999
print(a)  # 原数组被修改
```

## 通用函数

通用函数（Universal Functions, ufunc）是能同时对数组中所有元素进行运算的函数。ufunc 是 NumPy 中向量化运算的核心，它们比 Python 循环快得多。

### 一元函数（Unary Functions）

一元函数接受一个数组作为输入，返回一个新数组。

| 函数 | 说明 | 示例 |
|------|------|------|
| **数学运算** | | |
| `np.sqrt(array)` | 平方根函数 | `np.sqrt([4, 9, 16])` → `[2, 3, 4]` |
| `np.exp(array)` | e^array[i] 的数组 | `np.exp([1, 2])` → `[2.718, 7.389]` |
| `np.abs(array)` / `np.fabs(array)` | 计算绝对值 | `np.abs([-1, -2])` → `[1, 2]` |
| `np.square(array)` | 计算各元素的平方 | `np.square([2, 3])` → `[4, 9]` |
| **对数运算** | | |
| `np.log(array)` | 自然对数（以 e 为底） | `np.log([1, 10])` |
| `np.log10(array)` | 常用对数（以 10 为底） | `np.log10([1, 10])` |
| `np.log2(array)` | 以 2 为底的对数 | `np.log2([1, 8])` |
| **符号判断** | | |
| `np.sign(array)` | 计算各元素正负号 | `np.sign([-1, 0, 1])` → `[-1, 0, 1]` |
| **特殊值判断** | | |
| `np.isnan(array)` | 计算各元素是否为 NaN | `np.isnan([1, np.nan])` |
| `np.isinf(array)` | 计算各元素是否为无穷大 | `np.isinf([1, np.inf])` |
| **三角函数** | | |
| `np.cos(array)` / `np.cosh(array)` | 余弦函数 / 双曲余弦 | `np.cos([0, np.pi])` |
| `np.sin(array)` / `np.sinh(array)` | 正弦函数 / 双曲正弦 | `np.sin([0, np.pi/2])` |
| `np.tan(array)` / `np.tanh(array)` | 正切函数 / 双曲正切 | `np.tan([0, np.pi/4])` |
| **数值处理** | | |
| `np.modf(array)` | 将整数和小数分离，返回两个数组 | `np.modf([3.14, 2.72])` |
| `np.ceil(array)` | 向上取整 | `np.ceil([3.1, 3.9])` → `[4, 4]` |
| `np.floor(array)` | 向下取整 | `np.floor([3.1, 3.9])` → `[3, 3]` |
| `np.rint(array)` | 四舍五入 | `np.rint([3.4, 3.6])` → `[3, 4]` |
| `np.trunc(array)` | 向 0 取整 | `np.trunc([3.9, -3.9])` → `[3, -3]` |

#### 一元函数使用示例

```python
import numpy as np

arr = np.array([1, 4, 9, 16, 25])

# 数学运算
print(np.sqrt(arr))      # [1. 2. 3. 4. 5.]
print(np.square(arr))    # [  1  16  81 256 625]

# 对数运算
arr2 = np.array([1, np.e, np.e**2])
print(np.log(arr2))       # [0. 1. 2.]

# 三角函数
arr3 = np.array([0, np.pi/2, np.pi])
print(np.sin(arr3))       # [0.0000000e+00 1.0000000e+00 1.2246468e-16]

# 数值处理
arr4 = np.array([3.14, 2.72, -1.5])
print(np.ceil(arr4))      # [ 4.  3. -1.]
print(np.floor(arr4))    # [ 3.  2. -2.]
print(np.rint(arr4))      # [ 3.  3. -2.]
```

### 二元函数（Binary Functions）

二元函数接受两个数组作为输入，返回一个新数组。

| 函数 | 说明 | 示例 |
|------|------|------|
| `np.add(array1, array2)` | 元素级加法 | `np.add([1, 2], [3, 4])` → `[4, 6]` |
| `np.subtract(array1, array2)` | 元素级减法 | `np.subtract([5, 6], [1, 2])` → `[4, 4]` |
| `np.multiply(array1, array2)` | 元素级乘法 | `np.multiply([2, 3], [4, 5])` → `[8, 15]` |
| `np.divide(array1, array2)` | 元素级除法 | `np.divide([10, 20], [2, 4])` → `[5, 5]` |
| `np.power(array1, array2)` | 元素级幂运算 | `np.power([2, 3], [2, 3])` → `[4, 27]` |
| `np.maximum(array1, array2)` | 元素级最大值 | `np.maximum([1, 5], [3, 4])` → `[3, 5]` |
| `np.minimum(array1, array2)` | 元素级最小值 | `np.minimum([1, 5], [3, 4])` → `[1, 4]` |

#### 二元函数使用示例

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
b = np.array([10, 20, 30, 40, 50])

print(np.add(a, b))         # [11, 22, 33, 44, 55]
print(np.subtract(b, a))    # [9, 18, 27, 36, 45]
print(np.multiply(a, b))    # [10, 40, 90, 160, 250]
print(np.divide(b, a))      # [10., 10., 10., 10., 10.]
print(np.power(a, 2))      # [1, 4, 9, 16, 25]
print(np.maximum(a, b))     # [10, 20, 30, 40, 50]
print(np.minimum(a, b))     # [1, 2, 3, 4, 5]
```

## 统计函数

NumPy 提供了丰富的统计函数，用于分析数组数据。

### 基本统计函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `np.sum(array)` | 求和 | `np.sum([1, 2, 3])` → `6` |
| `np.mean(array)` | 平均值 | `np.mean([1, 2, 3])` → `2.0` |
| `np.std(array)` | 标准差 | `np.std([1, 2, 3])` → `0.816...` |
| `np.var(array)` | 方差 | `np.var([1, 2, 3])` → `0.666...` |
| `np.min(array)` | 最小值 | `np.min([3, 1, 2])` → `1` |
| `np.max(array)` | 最大值 | `np.max([3, 1, 2])` → `3` |
| `np.argmin(array)` | 最小值的索引 | `np.argmin([3, 1, 2])` → `1` |
| `np.argmax(array)` | 最大值的索引 | `np.argmax([3, 1, 2])` → `0` |
| `np.median(array)` | 中位数 | `np.median([1, 2, 3])` → `2.0` |
| `np.percentile(array, q)` | q分位数 | `np.percentile([1,2,3,4], 25)` → `1.75` |

#### 基本统计函数使用示例

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

print(np.sum(arr))          # 55
print(np.mean(arr))          # 5.5
print(np.std(arr))           # 2.872281...
print(np.min(arr))           # 1
print(np.max(arr))           # 10
print(np.argmin(arr))        # 0
print(np.argmax(arr))        # 9
print(np.median(arr))        # 5.5

# 多维数组统计
arr2d = np.array([[1, 2, 3],
                  [4, 5, 6]])

print(np.sum(arr2d))             # 21
print(np.sum(arr2d, axis=0))     # [5, 7, 9] - 按列求和
print(np.sum(arr2d, axis=1))     # [6, 15] - 按行求和
```

### 累计统计函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `np.cumsum(array)` | 累计求和 | `np.cumsum([1, 2, 3])` → `[1, 3, 6]` |
| `np.cumprod(array)` | 累计乘积 | `np.cumprod([1, 2, 3])` → `[1, 2, 6]` |

#### 累计统计函数使用示例

```python
import numpy as np

arr = np.array([1, 2, 3, 4, 5])

print(np.cumsum(arr))    # [1, 3, 6, 10, 15]
print(np.cumprod(arr))   # [1, 2, 6, 24, 120]
```

## 排序

NumPy 提供了多种排序功能。

### 排序函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `np.sort(array)` | 返回排序后的副本 | `np.sort([3, 1, 2])` → `[1, 2, 3]` |
| `np.argsort(array)` | 返回排序后的索引 | `np.argsort([3, 1, 2])` → `[1, 2, 0]` |
| `np.lexsort(keys)` | 多列排序 | `np.lexsort((a, b))` |
| `np.searchsorted(array, values)` | 二分查找 | `np.searchsorted([1,3,5], 4)` → `1` |

#### 排序函数使用示例

```python
import numpy as np

arr = np.array([3, 1, 2, 5, 4])

# 排序
print(np.sort(arr))      # [1, 2, 3, 4, 5]

# 获取排序后的索引
print(np.argsort(arr))   # [1, 2, 0, 4, 3]

# 多维数组排序
arr2d = np.array([[3, 2, 8],
                  [1, 7, 3]])
print(np.sort(arr2d, axis=1))  # 按行排序
print(np.sort(arr2d, axis=0))  # 按列排序

# 二分查找
arr_sorted = np.array([1, 3, 5, 7, 9])
print(np.searchsorted(arr_sorted, 4))  # 2 - 应该插入在索引2的位置
```

## 线性代数

NumPy 提供了完整的线性代数功能。

### 常用线性代数函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `np.dot(a, b)` | 矩阵乘法 | `np.dot(a, b)` |
| `np.matmul(a, b)` | 矩阵乘法（@ 操作符） | `a @ b` |
| `np.linalg.inv(a)` | 矩阵求逆 | `np.linalg.inv(a)` |
| `np.linalg.det(a)` | 行列式 | `np.linalg.det(a)` |
| `np.linalg.eig(a)` | 特征值和特征向量 | `np.linalg.eig(a)` |
| `np.linalg.svd(a)` | 奇异值分解 | `np.linalg.svd(a)` |
| `np.linalg.qr(a)` | QR分解 | `np.linalg.qr(a)` |
| `np.trace(a)` | 矩阵的迹（对角线元素之和） | `np.trace(a)` |
| `np.linalg.norm(x)` | 向量或矩阵的范数 | `np.linalg.norm(x)` |

#### 线性代数使用示例

```python
import numpy as np

# 矩阵乘法
A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

print(np.dot(A, B))
# [[19, 22]
#  [43, 50]]

# 或者使用 @ 操作符
print(A @ B)

# 矩阵求逆
A_inv = np.linalg.inv(A)
print(A_inv)
# [[-2. , 1. ],
#  [ 1.5, -0.5]]

# 行列式
det = np.linalg.det(A)
print(det)  # -2.0

# 特征值和特征向量
eigenvalues, eigenvectors = np.linalg.eig(A)
print(eigenvalues)  # [-0.37228132,  5.37228132]
print(eigenvectors)
```

## 随机数生成

NumPy 的 random 模块提供了强大的随机数生成功能。

### 随机数函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `np.random.rand(d0, d1, ...)` | 生成[0, 1)均匀分布 | `np.random.rand(3, 2)` |
| `np.random.randn(d0, d1, ...)` | 生成标准正态分布 | `np.random.randn(3, 2)` |
| `np.random.randint(low, high, size)` | 生成随机整数 | `np.random.randint(0, 10, (3, 2))` |
| `np.random.random(size)` | 生成[0, 1)均匀分布 | `np.random.random((3, 2))` |
| `np.random.choice(a, size, replace, p)` | 从数组中随机选择 | `np.random.choice([1,2,3], 5)` |
| `np.random.shuffle(a)` | 原地打乱数组 | `np.random.shuffle(a)` |
| `np.random.permutation(a)` | 返回打乱后的数组（不修改原数组） | `np.random.permutation(a)` |

#### 随机数使用示例

```python
import numpy as np

# 设置随机种子以保证结果可重复
np.random.seed(42)

# 均匀分布
print(np.random.rand(3))        # [0.374..., 0.950..., 0.732...]
print(np.random.rand(2, 3))

# 标准正态分布
print(np.random.randn(3))       # [0.647..., 1.523..., -0.234...]

# 随机整数
print(np.random.randint(0, 10, 5))  # [5, 0, 3, 2, 6]
print(np.random.randint(0, 10, (2, 3)))

# 从数组中随机选择
arr = np.array([1, 2, 3, 4, 5])
print(np.random.choice(arr, 3))              # 不放回抽取
print(np.random.choice(arr, 10, replace=True))  # 放回抽样

# 打乱数组
arr = np.array([1, 2, 3, 4, 5])
np.random.shuffle(arr)
print(arr)  # [3, 5, 1, 4, 2] - 原地修改

# 不修改原数组的打乱
arr = np.array([1, 2, 3, 4, 5])
arr_new = np.random.permutation(arr)
print(arr)    # [1, 2, 3, 4, 5] - 原数组不变
print(arr_new) # [4, 1, 3, 5, 2]
```

### 分布函数

NumPy 支持多种概率分布的随机数生成：

```python
import numpy as np

# 二项分布
print(np.random.binomial(n=10, p=0.5, size=5))

# 正态分布
print(np.random.normal(loc=0, scale=1, size=(2, 3)))

# 泊松分布
print(np.random.poisson(lam=5, size=5))

# 均匀分布
print(np.random.uniform(low=0, high=10, size=5))

# 指数分布
print(np.random.exponential(scale=1, size=5))

# Gamma分布
print(np.random.gamma(shape=2, scale=2, size=5))
```

## 文件输入输出

NumPy 提供了方便的文件IO功能。

### 保存和加载数组

```python
import numpy as np

# 保存单个数组
arr = np.array([1, 2, 3, 4, 5])
np.save('arr.npy', arr)

# 加载数组
arr_loaded = np.load('arr.npy')
print(arr_loaded)  # [1, 2, 3, 4, 5]

# 保存多个数组
arr1 = np.array([1, 2, 3])
arr2 = np.array([4, 5, 6])
np.savez('arrays.npz', a=arr1, b=arr2)

# 加载多个数组
data = np.load('arrays.npz')
print(data['a'])  # [1, 2, 3]
print(data['b'])  # [4, 5, 6]

# 保存为文本文件
arr = np.array([1, 2, 3, 4, 5])
np.savetxt('arr.txt', arr)
np.savetxt('arr.csv', arr, delimiter=',')

# 加载文本文件
arr_loaded = np.loadtxt('arr.txt')
arr_loaded = np.loadtxt('arr.csv', delimiter=',')
```

## 内存优化技巧

### 节省内存的方法

```python
import numpy as np

# 使用更小的数据类型
arr_float64 = np.array([1, 2, 3], dtype=np.float64)  # 24 bytes
arr_float32 = np.array([1, 2, 3], dtype=np.float32)  # 12 bytes

# 使用视图而不是副本
arr = np.arange(10)
view = arr[::2]  # 视图，不占用额外内存

# 使用原地操作
arr = np.array([1, 2, 3, 4, 5])
arr *= 2  # 原地操作，不创建新数组

# 使用生成器而不是创建大数组
def generate_large_array():
    for i in range(1000000):
        yield i
```

---