---
title: SciPy 完全指南   科学计算与数值分析
author: Joekma
pubDatetime: 2026-08-07T00:00:00.000+08:00
slug: scipy
featured: false
draft: false
tags:
  - Python
  - SciPy
  - docs
description: SciPy 科学计算完全指南，涵盖数值积分、优化、插值、线性代数、统计分析、信号处理与稀疏数组等核心功能。
series: Python常用外部库
seriesOrder: 14
language: zh-CN
---

## 简介

SciPy（Scientific Python）是建立在 NumPy 之上的科学计算库。NumPy 负责高性能数组和基础运算，SciPy 则提供数值积分、优化、插值、信号处理、统计分析、稀疏计算等高级算法。

SciPy 的大多数函数接收 NumPy 数组作为输入，并继续返回数组或带有状态信息的结果对象。因此，掌握 NumPy 的数组、切片、广播和数据类型后，就可以自然地进入 SciPy。

### 核心特性

- **算法丰富**：覆盖科学计算中的常见数值算法
- **性能优秀**：底层使用经过优化的 C、C++ 和 BLAS/LAPACK 实现
- **模块清晰**：不同子模块对应不同的计算领域
- **兼容 NumPy**：直接使用 `ndarray` 作为主要数据载体
- **结果完整**：许多求解器同时返回解、误差和收敛状态
- **生态成熟**：广泛用于工程、科研、数据分析和机器学习

### 应用场景

- **工程计算**：线性方程、常微分方程、信号滤波
- **科学研究**：数值积分、特殊函数、物理常量
- **数据分析**：概率分布、假设检验、回归分析
- **模型拟合**：参数估计、最小二乘、非线性优化
- **空间分析**：距离矩阵、最近邻、凸包和三角剖分
- **图像处理**：平滑、边缘检测、连通区域分析
- **大规模计算**：稀疏数组、稀疏线性方程和图算法

### NumPy 与 SciPy 的关系

| 对比项       | NumPy                | SciPy                          |
| ------------ | -------------------- | ------------------------------ |
| 核心定位     | 数组与基础数值运算   | 高级科学计算算法               |
| 主要数据结构 | `ndarray`            | NumPy 数组、稀疏数组、结果对象 |
| 线性代数     | 常用基础运算         | 更完整的分解与专业求解器       |
| 统计能力     | 描述统计、随机数     | 概率分布、检验、回归和重采样   |
| 优化与积分   | 功能较少             | 提供完整求解模块               |
| 典型导入     | `import numpy as np` | `from scipy import optimize`   |

> **使用原则**：先用 NumPy 表示和整理数据，再使用 SciPy 子模块完成专业数值计算。

## 安装与导入

### 版本要求

本文示例基于以下环境验证：

- Python 3.12
- NumPy 2.x
- SciPy 1.18.x

SciPy 1.18.0 要求 Python 3.12–3.14 和 NumPy 2.0 及以上版本。使用更早的 Python 时，包管理器通常会选择与当前 Python 兼容的旧版 SciPy，但部分新 API 可能不可用。

### 安装 SciPy

```bash
# 使用 uv 管理项目依赖
uv add "scipy==1.18.*"

# 使用 pip 安装可复现环境
python -m pip install "numpy>=2,<3" "scipy==1.18.*"

# 使用 conda-forge
conda install -c conda-forge scipy=1.18
```

实际项目应在虚拟环境中安装依赖，避免系统 Python 中的 NumPy 与 SciPy 版本不匹配。

### 检查版本

```python
import numpy as np
import scipy

print(f"NumPy version: {np.__version__}")
print(f"SciPy version: {scipy.__version__}")

# NumPy version: 2.5.1
# SciPy version: 1.18.0
```

### 推荐导入方式

SciPy 推荐保留子模块命名空间，使函数来源一目了然。

```python
import numpy as np
import scipy
from scipy import integrate, linalg, optimize, signal, stats

# 通过子模块访问函数
result = integrate.quad(np.sin, 0, np.pi)
root = optimize.root_scalar(lambda x: x**2 - 2, bracket=(0, 2))

print(result[0])  # 2.0
print(root.root)  # 1.4142135623731364
```

以下写法应避免：

```python
# 不推荐：函数来源不明确，还可能污染命名空间
# from scipy import *

# 不推荐：访问以下划线开头的私有实现
# from scipy.optimize._minpack_py import curve_fit
```

> **最佳实践**：从公开子模块导入命名空间，例如 `from scipy import optimize`，再使用 `optimize.minimize()`。私有模块可能在没有兼容承诺的情况下变化。

## SciPy 模块速查

SciPy 按计算领域组织为多个子模块。实际使用时通常只导入当前任务需要的模块。

| 子模块                | 主要用途       | 常用功能                     |
| --------------------- | -------------- | ---------------------------- |
| `scipy.cluster`       | 聚类分析       | 向量量化、层次聚类           |
| `scipy.constants`     | 物理与数学常量 | 光速、引力常量、单位转换     |
| `scipy.datasets`      | 示例数据       | 测试图像和数据集             |
| `scipy.differentiate` | 数值微分       | 导数、Jacobian、Hessian      |
| `scipy.fft`           | 傅里叶变换     | FFT、实数 FFT、频率轴        |
| `scipy.integrate`     | 数值积分       | 定积分、采样积分、微分方程   |
| `scipy.interpolate`   | 插值           | 样条、保形插值、多维插值     |
| `scipy.io`            | 科学文件 I/O   | MAT、WAV、Matrix Market      |
| `scipy.linalg`        | 线性代数       | 方程求解、矩阵分解、特征值   |
| `scipy.ndimage`       | 多维图像处理   | 滤波、形态学、区域标记       |
| `scipy.optimize`      | 优化与求根     | 最小化、方程求解、曲线拟合   |
| `scipy.signal`        | 信号处理       | 滤波、频谱、卷积、峰值检测   |
| `scipy.sparse`        | 稀疏计算       | 稀疏数组、稀疏求解器、图算法 |
| `scipy.spatial`       | 空间算法       | 距离、KDTree、凸包           |
| `scipy.special`       | 特殊函数       | Gamma、误差函数、Bessel 函数 |
| `scipy.stats`         | 统计分析       | 分布、检验、回归、重采样     |

### 模块选择建议

- 数值求导使用 `scipy.differentiate`
- 连续函数积分使用 `scipy.integrate.quad`
- 求方程的根使用 `scipy.optimize.root_scalar` 或 `root`
- 线性方程优先使用 `scipy.linalg.solve`
- 实信号频谱优先使用 `scipy.fft.rfft`
- 新的稀疏代码优先使用 `csr_array` 等稀疏数组

`scipy.fftpack` 是旧式傅里叶模块，新代码应使用 `scipy.fft`。`scipy.odr` 已进入弃用流程，因此本文不再展开。

## 常量与特殊函数

### 物理常量 `scipy.constants`

`scipy.constants` 提供常见物理常量、单位前缀和单位转换函数，可以避免在代码中手写近似值。

| 常量或函数              | 说明                     |
| ----------------------- | ------------------------ |
| `constants.c`           | 真空中的光速，单位为 m/s |
| `constants.G`           | 万有引力常量             |
| `constants.h`           | 普朗克常量               |
| `constants.k`           | Boltzmann 常量           |
| `physical_constants`    | 物理常量详细字典         |
| `convert_temperature()` | 温度单位转换             |

```python
from scipy import constants

# 摄氏度转 Kelvin 和华氏度
kelvin = constants.convert_temperature(25.0, "Celsius", "Kelvin")
fahrenheit = constants.convert_temperature(25.0, "Celsius", "Fahrenheit")

print(kelvin)      # 298.15
print(fahrenheit)  # 77.0
print(constants.c) # 299792458.0

# E = mc²：1 克物质对应的静能
mass = 0.001
energy = mass * constants.c**2
print(f"{energy:.3e} J")  # 8.988e+13 J
```

### 特殊函数 `scipy.special`

特殊函数广泛用于概率、物理和工程计算。大多数函数都支持 NumPy 数组和广播。

| 函数           | 说明                        |
| -------------- | --------------------------- |
| `gamma(x)`     | Gamma 函数                  |
| `gammaln(x)`   | Gamma 函数绝对值的自然对数  |
| `erf(x)`       | 误差函数                    |
| `jv(v, x)`     | 第一类 Bessel 函数          |
| `expit(x)`     | 数值稳定的 Sigmoid 函数     |
| `logsumexp(x)` | 稳定计算 `log(sum(exp(x)))` |

```python
import numpy as np
from scipy import special

x = np.array([-2.0, 0.0, 2.0])
integers = np.array([1.0, 2.0, 3.0, 4.0])

print(np.round(special.expit(x), 4))
# [0.1192 0.5    0.8808]

print(special.gamma(integers))
# [1. 1. 2. 6.]

print(np.round(special.erf([0.0, 1.0, 2.0]), 4))
# [0.     0.8427 0.9953]
```

### 稳定计算 LogSumExp

直接计算很大的指数可能溢出，而 `logsumexp` 会先做数值缩放。

```python
import numpy as np
from scipy import special

values = np.array([1000.0, 1001.0, 1002.0])

stable = special.logsumexp(values)
print(round(stable, 4))  # 1002.4076

# 直接计算会溢出，不应使用
with np.errstate(over="ignore"):
    unstable = np.log(np.sum(np.exp(values)))
print(unstable)  # inf
```

> **最佳实践**：遇到极大、极小概率或对数似然时，优先寻找 `scipy.special` 中的稳定实现，不要直接拼接容易溢出的指数运算。

## 线性代数

`scipy.linalg` 基于 BLAS 和 LAPACK，提供比 `numpy.linalg` 更完整的矩阵分解和求解功能。

### 常用线性代数函数

| 函数                 | 说明                            |
| -------------------- | ------------------------------- |
| `linalg.solve(a, b)` | 求解线性方程 `a @ x = b`        |
| `linalg.lstsq(a, b)` | 求最小二乘解                    |
| `linalg.eig(a)`      | 一般矩阵的特征值和特征向量      |
| `linalg.eigh(a)`     | 对称或 Hermitian 矩阵的特征分解 |
| `linalg.svd(a)`      | 奇异值分解                      |
| `linalg.qr(a)`       | QR 分解                         |
| `linalg.cholesky(a)` | Cholesky 分解                   |
| `linalg.lu(a)`       | LU 分解                         |
| `linalg.det(a)`      | 计算行列式                      |
| `linalg.norm(a)`     | 计算向量或矩阵范数              |

### 求解线性方程

```python
import numpy as np
from scipy import linalg

A = np.array([
    [3.0, 2.0],
    [1.0, 2.0],
])
b = np.array([5.0, 5.0])

x = linalg.solve(A, b)

print(x)                       # [0.  2.5]
print(np.allclose(A @ x, b))   # True
```

求解 `A @ x = b` 时，不要先计算 `linalg.inv(A) @ b`。`solve` 更快、更节省内存，数值误差通常也更小。

### 最小二乘拟合

当方程数量多于未知数时，可以使用最小二乘寻找误差平方和最小的解。

```python
import numpy as np
from scipy import linalg

x = np.arange(5.0)
y = np.array([1.1, 2.9, 5.2, 6.8, 9.1])

# y = slope * x + intercept
design = np.column_stack((x, np.ones_like(x)))
coefficients, residuals, rank, singular_values = linalg.lstsq(design, y)
slope, intercept = coefficients

print(np.round(coefficients, 2))  # [1.99 1.04]
print(rank)                        # 2
print(np.round(design @ coefficients, 2))
# [1.04 3.03 5.02 7.01 9.  ]
```

`lstsq` 的核心结果是解向量。残差数组的形状会随矩阵形状、秩和底层驱动变化，不应把非核心返回细节写死。

### 特征分解

对称实矩阵应优先使用 `eigh`，它会利用矩阵结构，并返回实数特征值。

```python
import numpy as np
from scipy import linalg

A = np.array([
    [4.0, 1.0],
    [1.0, 3.0],
])

eigenvalues, eigenvectors = linalg.eigh(A)

print(np.round(eigenvalues, 6))
# [2.381966 4.618034]

# 验证 A @ v = lambda * v
first_vector = eigenvectors[:, 0]
print(np.allclose(A @ first_vector, eigenvalues[0] * first_vector))
# True
```

### 奇异值分解

奇异值分解（Singular Value Decomposition，SVD）可用于降维、压缩、伪逆和矩阵秩分析。

```python
import numpy as np
from scipy import linalg

A = np.array([
    [3.0, 1.0],
    [1.0, 3.0],
    [1.0, 1.0],
])

U, singular_values, Vh = linalg.svd(A, full_matrices=False)
reconstructed = U @ np.diag(singular_values) @ Vh

print(np.round(singular_values, 4))  # [4.2426 2.    ]
print(np.allclose(A, reconstructed)) # True
```

### 分解方法选择

| 问题           | 推荐方法                     |
| -------------- | ---------------------------- |
| 解一般线性方程 | `solve`                      |
| 解正定矩阵方程 | `solve(..., assume_a="pos")` |
| 超定或欠定方程 | `lstsq`                      |
| 对称矩阵特征值 | `eigh`                       |
| 一般矩阵特征值 | `eig`                        |
| 降维与低秩近似 | `svd`                        |
| 正定矩阵分解   | `cholesky`                   |

## 优化与方程求解

`scipy.optimize` 用于寻找函数极值、方程根、最小二乘解和约束优化结果。

### 常用优化函数

| 函数                | 说明                     |
| ------------------- | ------------------------ |
| `minimize_scalar()` | 单变量函数最小化         |
| `minimize()`        | 多变量函数最小化         |
| `root_scalar()`     | 单变量方程求根           |
| `root()`            | 多变量方程组求根         |
| `least_squares()`   | 非线性最小二乘           |
| `curve_fit()`       | 根据观测数据拟合函数参数 |
| `linprog()`         | 线性规划                 |

### 单变量方程求根

对于能够给出异号区间的连续函数，Brent 方法通常既可靠又高效。

```python
from scipy import optimize

def equation(x):
    return x**3 - 2

result = optimize.root_scalar(
    equation,
    bracket=(0, 2),
    method="brentq",
)

print(result.converged)          # True
print(round(result.root, 6))     # 1.259921
print(abs(equation(result.root)) < 1e-12)  # True
```

`bracket=(a, b)` 要求函数在区间两端异号。若不能提供有效区间，需要根据问题选择 Newton、Secant 或其他方法，并提供适当初值。

### 多变量函数最小化

```python
import numpy as np
from scipy import optimize

def objective(point):
    x, y = point
    return (x - 3) ** 2 + 2 * (y + 1) ** 2

result = optimize.minimize(
    objective,
    x0=np.array([0.0, 0.0]),
    method="BFGS",
)

print(result.success)             # True
print(np.round(result.x, 6))      # [ 3. -1.]
print(result.fun < 1e-12)         # True
print(result.message)             # Optimization terminated successfully.
```

优化结果不能只看 `result.x`，还应检查：

- `success`：算法是否成功终止
- `message`：终止原因
- `fun`：目标函数值
- `nit`：迭代次数
- `nfev`：目标函数计算次数

### 曲线拟合

`curve_fit` 根据观测数据估计非线性模型参数。下面拟合指数衰减模型。

```python
import numpy as np
from scipy import optimize

rng = np.random.default_rng(42)

def decay_model(x, amplitude, rate, offset):
    return amplitude * np.exp(-rate * x) + offset

x_data = np.linspace(0, 4, 25)
y_data = decay_model(x_data, 2.5, 1.3, 0.4)
y_data += rng.normal(0, 0.03, x_data.size)

parameters, covariance = optimize.curve_fit(
    decay_model,
    x_data,
    y_data,
    p0=(2.0, 1.0, 0.0),
)
standard_errors = np.sqrt(np.diag(covariance))

print(np.round(parameters, 4))
# [2.4949 1.3172 0.4058]

print(np.round(standard_errors, 4))
# [0.02   0.0235 0.0093]
```

拟合成功并不代表模型正确。还要检查残差、参数相关性、异常值和模型假设。参数初值、边界和数据尺度都会影响非线性拟合。

> **最佳实践**：优化前先缩放量级差异很大的变量，并检查求解器状态。算法返回结果不等于算法已经收敛。

## 数值微分与积分

### 数值微分 `scipy.differentiate`

`scipy.differentiate` 使用有限差分近似黑盒函数的导数。该子模块从 SciPy 1.15 开始提供，本文使用的是 SciPy 1.18 API。

| 函数                         | 说明                     |
| ---------------------------- | ------------------------ |
| `differentiate.derivative()` | 一阶导数                 |
| `differentiate.jacobian()`   | 向量函数的 Jacobian 矩阵 |
| `differentiate.hessian()`    | 标量函数的 Hessian 矩阵  |

```python
import numpy as np
from scipy import differentiate

x = np.array([0.0, np.pi / 6, np.pi / 3])
result = differentiate.derivative(np.sin, x)

print(np.round(result.df, 6))
# [1.       0.866025 0.5     ]

print(result.success)
# [ True  True  True]

print(np.allclose(result.df, np.cos(x), atol=1e-10))
# True
```

结果对象还包含 `error`、`nit` 和 `nfev`，分别表示误差估计、迭代次数和函数计算次数。

有限差分会受到步长和浮点舍入误差影响。若函数存在解析导数、自动微分或更稳定的专用公式，应优先使用这些方法。

### 数值积分 `scipy.integrate`

| 函数                     | 说明                          |
| ------------------------ | ----------------------------- |
| `quad()`                 | 一维自适应积分                |
| `dblquad()`              | 二重积分                      |
| `trapezoid()`            | 对采样数据使用梯形法积分      |
| `simpson()`              | 对采样数据使用 Simpson 法积分 |
| `cumulative_trapezoid()` | 累计梯形积分                  |
| `solve_ivp()`            | 求解常微分方程初值问题        |

### 连续函数积分

`quad` 返回积分值和绝对误差估计。

```python
import numpy as np
from scipy import integrate

value, error = integrate.quad(np.sin, 0, np.pi)

print(value)                       # 2.0
print(f"{error:.3e}")             # 2.220e-14
print(abs(value - 2.0) < 1e-12)   # True
```

### 对采样数据积分

```python
import numpy as np
from scipy import integrate

x = np.linspace(0, 1, 11)
y = x**2

area_trapezoid = integrate.trapezoid(y, x=x)
area_simpson = integrate.simpson(y, x=x)

print(round(area_trapezoid, 6))  # 0.335
print(round(area_simpson, 6))    # 0.333333
```

对于光滑函数和等距采样，Simpson 法通常比梯形法更准确，但真实数据中的噪声和非等距采样仍需单独考虑。

### 求解常微分方程

下面求解指数衰减方程 `y' = -2y`，初值为 `y(0) = 1`。

```python
import numpy as np
from scipy import integrate

def decay(t, y):
    return -2 * y

t_eval = np.linspace(0, 2, 5)
solution = integrate.solve_ivp(
    decay,
    t_span=(0, 2),
    y0=[1.0],
    t_eval=t_eval,
    rtol=1e-9,
    atol=1e-12,
)

print(solution.success)  # True
print(np.round(solution.y[0], 6))
# [1.       0.367879 0.135335 0.049787 0.018316]

print(np.allclose(solution.y[0], np.exp(-2 * t_eval), rtol=1e-7))
# True
```

`rtol` 控制相对误差，`atol` 控制接近零时的绝对误差。容差越严格，函数计算次数通常越多。

## 插值

插值用于根据离散数据估计中间位置的值。不同插值器适用于不同的数据维度、光滑性和单调性要求。

### 插值方法速查

| 方法                      | 适用场景                   |
| ------------------------- | -------------------------- |
| `numpy.interp()`          | 一维线性插值               |
| `CubicSpline`             | 光滑的一维三次样条         |
| `PchipInterpolator`       | 保持单调性并减少过冲       |
| `make_interp_spline`      | 构造可控阶数的 B 样条      |
| `RegularGridInterpolator` | 规则或直角网格上的多维插值 |
| `griddata`                | 非结构化多维数据插值       |
| `RBFInterpolator`         | 散点数据的径向基函数插值   |

`interp1d` 和 `Rbf` 已属于旧接口，新代码应使用表中的现代替代方法。

### 三次样条及其导数

```python
import numpy as np
from scipy import interpolate

x = np.array([0.0, 1.0, 2.0, 3.0])
y = x**2
query = np.array([0.5, 1.5, 2.5])

spline = interpolate.CubicSpline(x, y)
values = spline(query)
derivatives = spline(query, 1)

print(values)       # [0.25 2.25 6.25]
print(derivatives)  # [1. 3. 5.]
```

### 保形插值

普通三次样条可能在相邻点之间产生过冲。对于单调数据，`PchipInterpolator` 通常更合适。

```python
import numpy as np
from scipy import interpolate

x = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
y = np.array([0.0, 1.0, 1.5, 1.8, 2.0])
query = np.array([0.5, 1.5, 2.5, 3.5])

interpolator = interpolate.PchipInterpolator(x, y)
values = interpolator(query)

print(np.round(values, 4))
# [0.5729 1.2865 1.6669 1.9112]

print(np.all(np.diff(values) > 0))  # True
```

插值前应确保坐标满足插值器要求，并提前处理重复坐标、缺失值和无穷值。是否允许外推也应显式决定，不能默认认为区间外结果可靠。

## 统计分析

`scipy.stats` 提供概率分布、描述统计、假设检验、相关分析、回归和重采样方法。

### 常用统计函数

| 函数或对象             | 说明                |
| ---------------------- | ------------------- |
| `stats.describe()`     | 描述性统计汇总      |
| `stats.zscore()`       | 标准分数            |
| `stats.norm`           | 正态分布            |
| `stats.ttest_ind()`    | 两独立样本 t 检验   |
| `stats.mannwhitneyu()` | Mann–Whitney U 检验 |
| `stats.pearsonr()`     | Pearson 相关分析    |
| `stats.linregress()`   | 一元线性回归        |
| `stats.bootstrap()`    | Bootstrap 置信区间  |

### 概率分布

概率分布对象支持 PDF、CDF、分位数和随机采样等统一接口。

```python
from scipy import stats

# 均值 100、标准差 15 的正态分布
distribution = stats.norm(loc=100, scale=15)

print(round(distribution.pdf(100), 6))  # 0.026596
print(distribution.cdf(100))            # 0.5
print(round(distribution.ppf(0.975), 4))# 129.3995
```

| 方法               | 含义                      |
| ------------------ | ------------------------- |
| `pdf(x)`           | 概率密度函数              |
| `cdf(x)`           | 累积分布函数              |
| `sf(x)`            | 生存函数，即 `1 - cdf(x)` |
| `ppf(q)`           | 分位数函数                |
| `rvs(size=...)`    | 随机采样                  |
| `mean()` / `var()` | 理论均值和方差            |

### Welch t 检验

Welch t 检验不假设两组数据方差相等，常用于比较两个独立样本的均值。

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(42)
group_a = rng.normal(loc=10.0, scale=1.2, size=30)
group_b = rng.normal(loc=10.8, scale=1.5, size=35)

result = stats.ttest_ind(group_a, group_b, equal_var=False)

print(np.round([group_a.mean(), group_b.mean()], 3))
# [10.02  10.922]

print(round(result.statistic, 4))  # -3.3626
print(round(result.pvalue, 6))     # 0.001326
```

p 值反映在原假设下观察到当前或更极端数据的程度，不代表差异大小。选择检验前还应判断样本是否独立、分布是否适合，并同时报告效应量和置信区间。统计显著不等于业务显著。

## 稀疏数组

当矩阵中大部分元素为零时，稀疏数组只保存非零项及其位置，可以显著减少内存和计算量。

SciPy 正在从旧式稀疏矩阵接口迁移到稀疏数组接口。新代码应优先使用 `csr_array`、`coo_array` 等 `*_array` 类型。

### 稀疏格式速查

| 格式        | 特点               | 适用场景               |
| ----------- | ------------------ | ---------------------- |
| `coo_array` | 使用坐标三元组存储 | 批量构建、格式转换     |
| `csr_array` | 按行压缩           | 行切片、矩阵向量乘法   |
| `csc_array` | 按列压缩           | 列切片、部分直接求解器 |
| `lil_array` | 按行保存列表       | 逐步修改和构建         |
| `dok_array` | 字典键值存储       | 随机位置增量写入       |
| `dia_array` | 按对角线存储       | 带状和对角矩阵         |

### 创建 CSR 稀疏数组

```python
import numpy as np
from scipy import sparse

data = np.array([4.0, 1.0, 3.0, 2.0])
rows = np.array([0, 0, 1, 2])
cols = np.array([0, 2, 1, 2])

matrix = sparse.csr_array(
    (data, (rows, cols)),
    shape=(3, 3),
)

print(matrix.toarray())
# [[4. 0. 1.]
#  [0. 3. 0.]
#  [0. 0. 2.]]

print(matrix.nnz)  # 4

vector = np.array([1.0, 2.0, 3.0])
print(matrix @ vector)  # [7. 6. 6.]
```

稀疏数组使用 `@` 执行矩阵乘法，`*` 表示逐元素乘法。不要依赖旧式稀疏矩阵中 `*` 表示矩阵乘法的行为。

### 求解稀疏线性方程

```python
import numpy as np
from scipy import sparse

n = 5
matrix = sparse.diags_array(
    (-np.ones(n - 1), 2 * np.ones(n), -np.ones(n - 1)),
    offsets=(-1, 0, 1),
    format="csr",
)
b = np.ones(n)

x = sparse.linalg.spsolve(matrix, b)

print(x)                         # [2.5 4.  4.5 4.  2.5]
print(np.allclose(matrix @ x, b))# True
```

### 稀疏图最短路径

`scipy.sparse.csgraph` 将稀疏邻接数组用于图算法。稀疏数组中未存储的位置表示没有边。

```python
import numpy as np
from scipy import sparse

adjacency = sparse.csr_array([
    [0.0, 2.0, 0.0, 1.0],
    [2.0, 0.0, 3.0, 0.0],
    [0.0, 3.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 0.0],
])

distances, predecessors = sparse.csgraph.shortest_path(
    adjacency,
    directed=False,
    indices=0,
    return_predecessors=True,
)

print(distances)    # [0. 2. 2. 1.]
print(predecessors) # [-9999     0     3     0]
```

### 稀疏计算注意事项

- `.nnz` 表示存储项数量，不一定等于数学意义上的非零元素数量
- COO 中重复坐标在转换格式时可能被合并
- 构建时适合 COO、LIL 或 DOK，计算时通常转换为 CSR 或 CSC
- 不要对大型稀疏数组随意调用 `.toarray()`
- 不要直接把任意 NumPy 函数用于稀疏数组，应先确认 SciPy 是否提供对应操作

## 空间算法

`scipy.spatial` 提供距离计算、最近邻查询、凸包、Voronoi 图和 Delaunay 三角剖分等空间算法。

### 常用空间函数

| 函数或类                | 说明                       |
| ----------------------- | -------------------------- |
| `distance.euclidean()`  | 两个向量的 Euclidean 距离  |
| `distance.pdist()`      | 一个样本集合内部的成对距离 |
| `distance.cdist()`      | 两个样本集合之间的距离     |
| `distance.squareform()` | 压缩距离与方阵之间转换     |
| `KDTree`                | 最近邻和范围查询           |
| `ConvexHull`            | 凸包                       |
| `Delaunay`              | Delaunay 三角剖分          |
| `Voronoi`               | Voronoi 图                 |

### KDTree 最近邻查询

```python
import numpy as np
from scipy import spatial

points = np.array([
    [0.0, 0.0],
    [1.0, 1.0],
    [2.0, 0.0],
    [3.0, 3.0],
])

tree = spatial.KDTree(points)
distance, index = tree.query([1.1, 0.9])

print(round(distance, 4)) # 0.1414
print(index)              # 1
print(points[index])      # [1. 1.]
```

查询多个点时，可以一次传入二维数组，并通过 `k` 指定需要的最近邻数量。

### 成对距离矩阵

```python
import numpy as np
from scipy import spatial

points = np.array([
    [0.0, 0.0],
    [1.0, 1.0],
    [2.0, 0.0],
    [3.0, 3.0],
])

condensed = spatial.distance.pdist(points, metric="euclidean")
distance_matrix = spatial.distance.squareform(condensed)

print(np.round(distance_matrix, 3))
# [[0.    1.414 2.    4.243]
#  [1.414 0.    1.414 2.828]
#  [2.    1.414 0.    3.162]
#  [4.243 2.828 3.162 0.   ]]
```

距离会受到特征量纲影响。例如，收入数值可能完全压过年龄数值。是否标准化取决于距离在具体业务中的含义。

## 傅里叶变换

傅里叶变换将时域信号转换到频域，用于分析周期、频率成分和滤波特征。

### 常用 FFT 函数

| 函数                 | 说明                    |
| -------------------- | ----------------------- |
| `fft()` / `ifft()`   | 一维复数 FFT 与逆变换   |
| `rfft()` / `irfft()` | 实数输入的 FFT 与逆变换 |
| `fftfreq()`          | 完整 FFT 的频率坐标     |
| `rfftfreq()`         | 实数 FFT 的非负频率坐标 |
| `fft2()` / `ifft2()` | 二维 FFT 与逆变换       |
| `fftshift()`         | 将零频率移动到频谱中心  |
| `next_fast_len()`    | 获取高效 FFT 长度       |

### 识别主要频率

下面构造包含 5 Hz 和 20 Hz 两种成分的实信号。

```python
import numpy as np
from scipy import fft

sample_rate = 200
duration = 1.0
t = np.arange(0, duration, 1 / sample_rate)

data = np.sin(2 * np.pi * 5 * t)
data += 0.5 * np.sin(2 * np.pi * 20 * t)

coefficients = fft.rfft(data)
frequencies = fft.rfftfreq(data.size, d=1 / sample_rate)
amplitudes = 2 * np.abs(coefficients) / data.size

# 跳过 0 Hz，选择幅值最大的两个频率
peak_indices = np.argsort(amplitudes[1:])[-2:] + 1
peak_indices = peak_indices[np.argsort(frequencies[peak_indices])]

print(frequencies[peak_indices])           # [ 5. 20.]
print(np.round(amplitudes[peak_indices], 3))# [1.  0.5]
```

### 采样与频谱注意事项

- 最高可辨识频率是采样率的一半，即 Nyquist 频率
- 频率分辨率约为 `采样率 / 样本数`
- 实信号优先使用 `rfft`，可以避免保存重复的负频率部分
- 频谱幅值要根据样本数和单边、双边频谱规则归一化
- 非整数周期截断会产生频谱泄漏，可以使用窗函数缓解
- 超长或不规则长度可用 `next_fast_len` 选择更高效的补零长度

## 信号处理

`scipy.signal` 提供数字滤波、卷积、频谱估计、重采样和峰值检测等功能。

### 常用信号处理函数

| 函数              | 说明                   |
| ----------------- | ---------------------- |
| `butter()`        | Butterworth 滤波器设计 |
| `sosfilt()`       | 使用二阶节实时滤波     |
| `sosfiltfilt()`   | 前后向零相位滤波       |
| `find_peaks()`    | 一维峰值检测           |
| `welch()`         | Welch 功率谱密度估计   |
| `fftconvolve()`   | 基于 FFT 的卷积        |
| `resample_poly()` | 多相滤波重采样         |

### 低通滤波与峰值检测

下面模拟一个 2 Hz 传感器信号，其中包含 30 Hz 干扰和随机噪声。

```python
import numpy as np
from scipy import signal

sample_rate = 200
t = np.arange(0, 2, 1 / sample_rate)
rng = np.random.default_rng(42)

clean = np.sin(2 * np.pi * 2 * t)
noisy = clean + 0.4 * np.sin(2 * np.pi * 30 * t)
noisy += rng.normal(0, 0.15, t.size)

# 使用二阶节形式设计四阶低通滤波器
sos = signal.butter(
    4,
    10,
    btype="low",
    fs=sample_rate,
    output="sos",
)
filtered = signal.sosfiltfilt(sos, noisy)

error_before = np.sqrt(np.mean((noisy - clean) ** 2))
error_after = np.sqrt(np.mean((filtered - clean) ** 2))

print(round(error_before, 4)) # 0.3184
print(round(error_after, 4))  # 0.0476

peaks, properties = signal.find_peaks(
    filtered,
    distance=sample_rate / 3,
    prominence=0.5,
)

print(len(peaks))             # 4
print(np.round(t[peaks], 3))
# [0.13  0.615 1.12  1.62 ]
```

高阶 IIR 滤波器使用传递函数系数 `b, a` 时可能出现数值问题。新代码应优先使用 `output="sos"`，再配合 `sosfilt` 或 `sosfiltfilt`。

`sosfiltfilt` 使用完整数据进行前后向滤波，适合离线分析；流式系统无法看到未来数据，应使用 `sosfilt` 并正确管理滤波状态。

## 多维图像处理

`scipy.ndimage` 面向 NumPy 多维数组，提供滤波、插值、形态学和区域分析功能。它不仅能处理图片，也适用于体数据、标签数组和规则网格数据。

### 常用图像处理函数

| 函数                | 说明                 |
| ------------------- | -------------------- |
| `gaussian_filter()` | Gaussian 平滑        |
| `median_filter()`   | 中值滤波             |
| `sobel()`           | Sobel 梯度与边缘检测 |
| `label()`           | 连通区域标记         |
| `binary_erosion()`  | 二值腐蚀             |
| `binary_dilation()` | 二值膨胀             |
| `rotate()`          | 旋转数组             |
| `zoom()`            | 缩放数组             |

### 平滑与边缘检测

下面使用合成矩阵演示处理流程，不依赖外部图片。

```python
import numpy as np
from scipy import ndimage

image = np.zeros((7, 7), dtype=float)
image[2:5, 2:5] = 1.0

smoothed = ndimage.gaussian_filter(image, sigma=1)
gradient_x = ndimage.sobel(smoothed, axis=1)
gradient_y = ndimage.sobel(smoothed, axis=0)
edges = np.hypot(gradient_x, gradient_y)

print(round(smoothed[3, 3], 4)) # 0.7795
print(round(edges.max(), 4))    # 2.1193
print(smoothed.shape)           # (7, 7)
```

`sigma` 越大，平滑程度越强，但边缘和细节也会损失更多。Sobel 结果的数值范围与输入 dtype、边界模式和图像尺度有关。

### 连通区域标记

```python
import numpy as np
from scipy import ndimage

binary = np.array([
    [1, 1, 0, 0, 0],
    [0, 1, 0, 1, 1],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 0, 0],
], dtype=bool)

labeled, count = ndimage.label(binary)

print(count) # 3
print(labeled)
# [[1 1 0 0 0]
#  [0 1 0 2 2]
#  [0 0 0 2 0]
#  [3 0 0 0 0]]
```

默认结构只把水平和垂直方向相邻的像素视为连通。需要包含对角连接时，应通过 `structure` 明确指定邻域。

### 边界与数据类型

- `mode="reflect"` 是许多滤波器的默认边界策略
- `mode="constant"` 会在边界外使用固定值
- 整数数组的输出可能发生截断或溢出，必要时先转为浮点数
- `axis` 决定滤波或梯度作用的维度
- 大数组处理时应关注中间结果的内存占用

## 文件输入输出

`scipy.io` 用于读写科学计算领域的常见文件格式。普通 NumPy 数组的持久化仍应优先使用 `np.save` 和 `np.savez`。

### 常用 I/O 功能

| 函数                       | 说明                    |
| -------------------------- | ----------------------- |
| `scipy.io.savemat()`       | 写入 MATLAB MAT 文件    |
| `scipy.io.loadmat()`       | 读取 MATLAB MAT 文件    |
| `scipy.io.wavfile.write()` | 写入 WAV 音频           |
| `scipy.io.wavfile.read()`  | 读取 WAV 音频           |
| `scipy.io.mmwrite()`       | 写入 Matrix Market 文件 |
| `scipy.io.mmread()`        | 读取 Matrix Market 文件 |

### MAT 文件读写

使用临时目录可以让示例运行后自动清理文件。

```python
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
import scipy

data = {
    "scores": np.array([88.0, 92.0, 95.0]),
    "matrix": np.arange(6.0).reshape(2, 3),
}

with TemporaryDirectory() as temp_dir:
    path = Path(temp_dir) / "example.mat"
    scipy.io.savemat(path, data)
    loaded = scipy.io.loadmat(path, squeeze_me=True, spmatrix=False)

    print(loaded["scores"]) # [88. 92. 95.]
    print(loaded["matrix"].shape) # (2, 3)
    print(np.array_equal(loaded["matrix"], data["matrix"])) # True
```

`loadmat` 返回的字典还包含以双下划线开头的元数据项。MATLAB 中的一维向量经常以二维行向量或列向量保存，可以根据需要使用 `.squeeze()`。

SciPy 原生支持 MATLAB v4、v6 和 v7 到 7.2 的 MAT 文件。MATLAB 7.3 使用 HDF5 容器，需要额外的 HDF5 读取库。

### WAV 音频读写

```python
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from scipy.io import wavfile

sample_rate = 8000
t = np.arange(80) / sample_rate
audio = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

with TemporaryDirectory() as temp_dir:
    path = Path(temp_dir) / "tone.wav"
    wavfile.write(path, sample_rate, audio)
    loaded_rate, loaded_audio = wavfile.read(path)

    print(loaded_rate)          # 8000
    print(loaded_audio.dtype)   # float32
    print(loaded_audio.shape)   # (80,)
    print(np.array_equal(audio, loaded_audio)) # True
```

浮点 WAV 数据通常使用 `[-1, 1]` 范围。整数 PCM 则需要根据 `int16`、`int32` 等数据类型的范围进行缩放。

### 格式选择

| 数据类型           | 推荐格式与工具                |
| ------------------ | ----------------------------- |
| 单个 NumPy 数组    | `.npy` 与 `np.save()`         |
| 多个 NumPy 数组    | `.npz` 与 `np.savez()`        |
| SciPy 稀疏数组     | `.npz` 与 `sparse.save_npz()` |
| MATLAB 交换数据    | `.mat` 与 `scipy.io`          |
| 稀疏矩阵跨语言交换 | Matrix Market                 |
| 简单音频数据       | WAV 与 `scipy.io.wavfile`     |

不要对来源不可信的 NumPy 对象文件启用 `allow_pickle=True`，因为反序列化 Pickle 数据可能执行任意代码。

## 数值计算最佳实践

### 选择合适的算法

| 任务          | 推荐                               | 避免                      |
| ------------- | ---------------------------------- | ------------------------- |
| 解线性方程    | `linalg.solve(A, b)`               | `linalg.inv(A) @ b`       |
| 对称特征分解  | `linalg.eigh()`                    | 不利用结构的 `eig()`      |
| 实信号 FFT    | `fft.rfft()`                       | 保存重复频率的完整 FFT    |
| 一维现代插值  | `CubicSpline`、`PchipInterpolator` | 新代码继续使用 `interp1d` |
| 常微分方程    | `integrate.solve_ivp()`            | 新代码继续使用 `odeint()` |
| 高阶 IIR 滤波 | SOS 表示                           | 直接使用高阶 `b, a` 系数  |
| 新稀疏代码    | `csr_array` 等稀疏数组             | 依赖旧矩阵专有语义        |
| 随机实验      | `default_rng(seed)`                | 修改全局随机状态          |
| 浮点结果验证  | `np.allclose()`                    | 使用 `==` 比较计算结果    |

### 检查收敛状态

不同求解器使用不同的状态字段：

- `optimize.minimize`：检查 `success` 和 `message`
- `optimize.root_scalar`：检查 `converged` 和 `flag`
- `integrate.solve_ivp`：检查 `success` 和 `message`
- `differentiate.derivative`：检查 `success`、`status` 和 `error`
- 统计检验：同时读取 `statistic` 与 `pvalue`

不要仅因为函数返回了一个数值就认为计算成功。

### 设置合理容差

容差过宽可能导致结果不准确，过严则会增加计算量，甚至因为浮点精度限制而无法收敛。

```python
import numpy as np
from scipy import linalg

A = np.array([
    [10.0, 2.0],
    [3.0, 8.0],
])
b = np.array([7.0, 5.0])

x = linalg.solve(A, b)
residual = A @ x - b

print(np.allclose(A @ x, b, rtol=1e-10, atol=1e-12)) # True
print(linalg.norm(residual) < 1e-12)                  # True
```

### 缩放输入数据

当变量相差多个数量级时，优化、插值和距离计算可能变得不稳定。常见处理包括：

- 对特征做标准化或无量纲化
- 调整优化变量和残差的尺度
- 使用适合矩阵结构的求解器
- 检查矩阵条件数和数据异常值
- 避免不必要的单位混用

### 控制内存与性能

- 使用向量化和批量接口，减少 Python 循环
- 大型稀疏数据保持稀疏格式，不随意转为稠密数组
- 根据读写方式选择 CSR、CSC、COO 等格式
- FFT 可用 `next_fast_len` 选择更高效的长度
- 避免重复分解同一个矩阵，能够复用时保存分解结果
- 不需要高精度时，评估 `float32` 是否满足误差要求

### 保证结果可复现

随机实验使用 `np.random.default_rng(seed)`，并记录 Python、NumPy 与 SciPy 版本。固定随机种子只能保证相同实现和环境中的随机输入可复现；线程数、硬件后端和算法变化仍可能造成微小差异。

### 处理警告和非有限值

开发和升级环境时，可以启用弃用警告：

```bash
python -Wd your_script.py
```

在进入求解器前，应使用 `np.isfinite()` 检查关键输入，并根据业务决定如何处理 NaN 和无穷值。不要为了隐藏问题而全局关闭警告。

> **最终原则**：选择符合问题结构的算法，检查状态和误差，用独立环境固定依赖，并以可验证的残差或统计指标确认结果。
