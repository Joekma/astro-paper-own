---
title: Python 正则表达式：贪婪模式、勉强模式、占有模式、分组捕获
author: Joekma
pubDatetime: 2024-08-12T00:00:00Z
modDatetime: 2026-04-29T00:00:00.000+08:00
slug: python-regex-advanced
featured: false
draft: false
tags:
  - Python
  - 正则表达式
description: '深入理解Python正则表达式的高级特性，包括贪婪模式、勉强模式、占有模式、分组捕获等核心概念。'
series: python
seriesOrder: 39
language: zh-CN
---

> 本篇文章将深入探讨 Python 正则表达式的高级特性。文章涵盖三种匹配模式（贪婪、勉强、占有）、分组捕获、Unicode 匹配等核心概念。无论你是想提升正则技能，还是准备面试，这篇文章都能帮助你全面掌握正则表达式的高级用法。

## 学习目标

读完本文后，你将掌握：

- 理解贪婪、勉强、占有三种匹配模式的区别
- 掌握分组捕获和非捕获分组的用法
- 学会使用后向引用和命名分组
- 了解 Unicode 字符的匹配方法
- 提升正则表达式的性能优化技巧


## 正则表达式的三种模式【贪婪、勉强、侵占】

为了更好地理解三种模式的区别，我们使用字符串 `xfooxxxxxxfoo` 作为测试目标。

### 1. 贪婪模式（Greedy）

**模式**：`.*foo`

**原理**：量词默认使用贪婪模式，尽可能多地匹配字符。当后续模式匹配失败时，会**回溯**减少匹配数量。

```python
import re

text = "xfooxxxxxxfoo"

# 贪婪模式：.* 会尽可能多地匹配
pattern = r'.*foo'
match = re.match(pattern, text)
print(match.group())  # 输出: xfooxxxxxxfoo
```

**匹配过程**：
1. `.*` 先吃掉所有字符：`xfooxxxxxxfoo`
2. 剩余字符串为空，无法匹配 `foo`
3. `.*` 吐出最后一个字符 `o`，剩余 `xfooxxxxxxfo`
4. 仍然无法匹配 `foo`
5. 继续回溯...直到吐出 `foo`
6. 最终匹配到：`xfooxxxxxx` 和 `foo` ✅

### 2. 勉强模式（Lazy）

**模式**：`.*?foo`

**原理**：也称为非贪婪模式，使用 `?` 后缀。尽可能少地匹配字符，一旦匹配成功就停止。

```python
import re

text = "xfooxxxxxxfoo"

# 勉强模式：.*? 尽可能少地匹配
pattern = r'.*?foo'
match = re.match(pattern, text)
print(match.group())  # 输出: xfoo
```

**匹配过程**：
1. `.*?` 先尝试匹配 0 个字符
2. 用空字符串去匹配 `foo`，失败
3. `.*?` 匹配第一个字符 `x`
4. 剩余 `fooxxxxxxfoo`，前三个字符恰好是 `foo`
5. 匹配成功！返回 `xfoo` ✅

### 3. 占有模式（Possessive）

**模式**：`.*+foo`

**原理**：使用 `+` 后缀，类似贪婪模式，但**不回溯**。一旦匹配成功就锁定，不释放字符。

```python
import re

text = "xfooxxxxxxfoo"

# 占有模式：.*+ 不会回溯
pattern = r'.*+foo'
match = re.match(pattern, text)
print(match)  # 输出: None（匹配失败）
```

**匹配过程**：
1. `.*+` 吃掉所有字符：`xfooxxxxxxfoo`
2. 剩余为空，无法匹配 `foo`
3. **不回溯**，直接返回匹配失败 ❌

### 模式对比总结

| 特性 | 贪婪模式 `.*` | 勉强模式 `.*?` | 占有模式 `.*+` |
|------|---------------|---------------|---------------|
| **回溯** | ✅ 会回溯 | ✅ 会回溯 | ❌ 不回溯 |
| **性能** | 较慢 | 较慢 | 最快 |
| **匹配策略** | 尽可能多 | 尽可能少 | 锁定匹配 |
| **适用场景** | 一般情况 | 需要精确匹配 | 性能敏感 |

### 实战对比

以字符串 `232hjdhfd7474$` 和正则 `\w+[a-z]` 为例：

```python
import re

text = "232hjdhfd7474$"

# 贪婪模式：会回溯
pattern_greedy = r'\w+[a-z]'
match1 = re.match(pattern_greedy, text)
print(f"贪婪模式: {match1.group()}")  # 输出: 232hjdhfd

# 占有模式：不回溯
pattern_possessive = r'\w++[a-z]'
match2 = re.match(pattern_possessive, text)
print(f"占有模式: {match2}")  # 输出: None（匹配失败）
```

**分析**：
- **贪婪模式**：`\w+` 先吃掉所有字符，然后逐步回溯，直到找到能匹配 `[a-z]` 的字符
- **占有模式**：`\w++` 吃掉所有字符后不回溯，因此匹配失败

> 💡 **提示**：在性能敏感的场景下，优先使用占有模式 `\++`，可以避免回溯带来的性能开销。

### 量词的三种模式对比

| 量词 | 贪婪模式 | 勉强模式 | 占有模式 | 含义 |
|------|---------|---------|---------|------|
| `X?` | `X?` | `X??` | `X?+` | 匹配 X 零次或一次 |
| `X*` | `X*` | `X*?` | `X*+` | 匹配 X 零次或多次 |
| `X+` | `X+` | `X+?` | `X++` | 匹配 X 一次或多次 |
| `X{n}` | `X{n}` | `X{n}?` | - | 匹配 X 恰好 n 次 |
| `X{n,}` | `X{n,}` | `X{n,}?` | - | 匹配 X 至少 n 次 |
| `X{n,m}` | `X{n,m}` | `X{n,m}?` | - | 匹配 X n 到 m 次 |

**说明**：
- **贪婪模式**：默认模式，尽可能多地匹配，匹配失败时会回溯
- **勉强模式**：使用 `?` 后缀，尽可能少地匹配（也称为非贪婪）
- **占有模式**：使用 `+` 后缀，不回溯，性能最佳

## 正则表达式高级用法（分组与捕获）

**分组的引入：**

对于要重复单个字符，非常简单，直接在字符后面加上限定符即可。例如 `a+` 表示匹配1个或1个以上的a，`a?` 表示匹配0个或1个a。

### 基础量词表

| 量词 | 含义 | 示例 |
|------|------|------|
| `X?` | X，一次或一次也没有 | `a?` 匹配 "" 或 "a" |
| `X*` | X，零次或多次 | `a*` 匹配 ""、"a"、"aa" |
| `X+` | X，一次或多次 | `a+` 匹配 "a"、"aa"、"aaa" |
| `X{n}` | X，恰好 n 次 | `a{3}` 匹配 "aaa" |
| `X{n,}` | X，至少 n 次 | `a{2,}` 匹配 "aa"、"aaa" |
| `X{n,m}` | X，至少 n 次，不超过 m 次 | `a{2,4}` 匹配 "aa"、"aaa"、"aaaa" |
  
但是我们如果要对多个字符进行重复怎么办呢？此时我们就要用到分组，我们可以使用小括号"()"来指定要重复的子表达式，然后对这个子表达式进行重复，例如：(abc)? 表示0个或1个abc 这里一 个括号的表达式就表示一个分组 。
分组可以分为两种形式，捕获组和非捕获组。

**分组的主要用途**：

- **创建子模式**：将多个字符组合成一个整体，便于重复匹配
- **捕获分组**：将匹配内容存储到内存，便于后续引用
- **向后引用**：使用 `\1`、`\2` 引用之前捕获的内容
- **组合操作**：对整体应用量词或其他操作
- **非捕获分组**：使用 `(?:)` 不存储内容，提高性能
- **原子分组**：使用 `(?>)` 防止回溯

**选择操作**  
选择操作可在多个可选模式中匹配一个。例如，你想在"The rime of the Ancyent Mariner"中找出the出现过多少次，包括THE，The和the的形式。  
若在RegExr上方文本框输入
```
(THE|The|the)
```
则看到所有the都被标亮。  
可以使用选项来使分组更简短。例如：
```
(?i)
```
可以让模式不再区分大小写。所有上面带选择操作的模式可以写成
```
(?i)the
```
正则表达式中的选项  

| 选项 | 说明 |
|------|------|
| `(?i)` | 不区分大小写 |
| `(?m)` | 多行模式 |
| `(?s)` | 点号匹配换行符 |
| `(?x)` | 忽略空白字符 |
| `(?L)` | 让 \w、\W、\b、\B 依赖当前区域设置 |
| `(?u)` | 让 \w、\W、\b、\B、\d、\D 依赖 Unicode 字符属性 |
| `(?R)` | 递归匹配整个模式 |
| `(?#...)` | 注释，圆括号内的内容被忽略 |
| `(?=...)` | 正向先行断言 |
| `(?!...)` | 负向先行断言 |
| `(?<=...)` | 正向后行断言 |
| `(?<!...)` | 负向后行断言 |

**子模式**  
正则表达式中的子模式是指分组中的一个或多个分组。  
例如：
```
(the|The|THE)
(t|T)h(e|eir)
```
括号对于子模式不是必须的。
```
\b[tT]h[ceinry]*\b
```
这个模式会匹配the或The还有thee，thy以及thence等单词。

  * \b匹配单词起始边界
  * [tT]是字符组，它匹配小写字母t或者大写字母T。可以看做是第一个子模式。
  * 然后匹配小写字母h
  * 第二个也就是最后一个子模式也表示为字符组[ceinry]，后面量词*表示一个或多个
  * \b单词的结尾边界

**捕获分组和后向引用**  
当一个模式的全部或者部分内容由一对括号分组时，它就对内容进行捕获并临时存储与内存中。可以通过后向引用重用捕获的内容。
```
\1
```
或者
```
$1
```
这里\1或$1引用的是第一个捕获的分组，而\2或$2引用的是第二个捕获的分组，以此类推。  
**命名分组**  
命名分组就是有名字的分组。  
假如你要查找含有连续六个0的字符串：
```
000000
```
就可以用这个模式对连续三个0的分组命名：
```
(?<z>0{3})
```
然后你可以再使用该分组：
```
(?<z>0{3})\k<z>
```
或者
```
(?<z>0{3})\k'z'
```
或者
```
(?<z>0{3})\g{z}
```
命名分组的语法

| 语法 | 说明 | 示例 |
|------|------|------|
| `(?<name>...)` | 定义命名捕获组 | `(?<z>0{3})` 定义名为 z 的组 |
| `\k<name>` | 引用命名组 | `\k<z>` 引用名为 z 的组 |
| `\k'name'` | 引用命名组（单引号形式） | `\k'z'` |
| `\g{name}` | 引用命名组（数字或名称） | `\g{z}` |
| `(?P<name>...)` | Python 特有的命名语法 | `(?P<z>0{3})` |
| `(?P=name)` | Python 中引用命名组 | `(?P=z)` |

**非捕获分组**  
非捕获分组不会将内容存储在内存中。在你并不想引用分组的时候可以使用，因为没有存储内容，所以可以带来性能上的提升。
```
(the|The|THE)
```
这个分组不需要任何后向引用，所以可以写成非捕获分组：
```
(?:the|The|THE)
```
添加选项将其变为不区分大小写的模式：
```
(?i)(?:the)
```
也可以这样写：
```
(?:(?i)the)
```
最推荐的写法是这样的：
```
(?i:the)
```
**原子分组**  
另一种非捕获分组是原子分组。  
如果你使用的正则表达式引擎进行回溯操作，这种分组就可以将回溯操作关闭，但它只针对原子分组内的部分，而不针对整个正则表达式。
```
(?>the)
```
小结：

1.(THE|The|the)，通过竖线|可以多个可选模式中匹配一个
2.括号()内的模式和字符组[]都可以看做一个分组
3.括号()内的分组会被捕获到内存中，使用\1或者$1后向引用
4.通过命名的分组可以用名字来后向引用
5.(?:the|The|THE)非捕获分组不会存在内存中，以提高性能

**匹配unicode字符**  
有时候我们需要匹配ASCII范围之外的字符。
```

"Qu’est-ce que la tolérance? c’est l’apanage de l’humanité. Nous sommes tous pétris de faiblesses et d’erreurs; pardonnons-nous réciproquement nos sottises, c’est la première loi de la nature." —Voltaire (1694–1778)

What is tolerance? It is the consequence of humanity. We are all formed of frailty and error;let us pardon reciprocally each other's folly--that is the first law of nature.

```
我们将伏尔泰的名言输入到<http://www.regexpal.com/>中，然后输入正则表达式
```
\u00e9
```
\u之后跟着的十六进制值00e9，这里不区分大小写，00E9也可以，00E9对接十进制值233，在ASCII（0~127）之外。  
注意在Regexpal中字母é，即小写e加上了一个重音符，被标亮了，这是因为在unicode中é就是U+00E9，所以\u00e9可以匹配到它。  
Regexpal.com是javascript的正则表达式实现。javascript也允许使用以下语法实现：
```
\xe9
```
现在我们在其他正则引擎中试一下。<http://regexhero.net/tester/>是.NET编写的。
```
古池
蛙飛び込む
水の音
    —芭蕉 (1644–1694)

At the ancient pond
a frog plunges into
the sound of water.
    —Basho (1644–1694)
```
以上是日本诗人松尾芭蕉的俳句。  
将其输入regexhero，然后输入正则
```
\u6c60
```
这是单词pond池塘所对应的日文字符的代码点。  
另外，也可以匹配一下长破折号
```
\u2014
```
或短破折号
```
\u2013
```
**用八进制数匹配字符**  
在正则中，用八进制数就是在反斜线后加三位数字。  
比如
```
\351
```
等同于
```
\u00e9
```
**匹配控制字符**  
代码库的ASCII.txt里是所有ASCII字符，一个字符一行，一共128行。  
在正则表达式中，像这样来指定一个控制字符：
```
\cx
```
其中x就是你想匹配的控制字符  
匹配unicode和其他字符

| 语法 | 说明 | 示例 |
|------|------|------|
| `\uXXXX` | 匹配 Unicode 字符（4位十六进制） | `\u00e9` 匹配 é |
| `\UXXXXXXXX` | 匹配 Unicode 字符（8位十六进制） | `\U000000E9` |
| `\xXX` | 匹配十六进制字符 | `\xe9` 匹配 é |
| `\OOO` | 匹配八进制字符（3位） | `\351` 匹配 é |
| `\cX` | 匹配控制字符 | `\cC` 匹配 Ctrl+C |
| `\N{name}` | 匹配 Unicode 命名字符 | `\N{LATIN SMALL LETTER E}` |
| `\a` | 匹配警报字符（ASCII 0x07） | - |
| `\b` | 匹配退格字符（ASCII 0x08） | - |
| `\f` | 匹配换页符（ASCII 0x0C） | - |
| `\n` | 匹配换行符（ASCII 0x0A） | - |
| `\r` | 匹配回车符（ASCII 0x0D） | - |
| `\t` | 匹配制表符（ASCII 0x09） | - |
| `\v` | 匹配垂直制表符（ASCII 0x0B） | - |
| `\0` | 匹配空字符（NULL） | - |

## 实战案例

### 案例 1：HTML 标签提取

在网页爬虫和数据提取中，经常需要从 HTML 中提取特定标签的内容。

```python
import re

html = '<div class="content"><p>这是第一个段落</p><p>这是第二个段落</p></div>'

# 贪婪模式：尽可能多地匹配
pattern_greedy = r'<p>.*</p>'
matches_greedy = re.findall(pattern_greedy, html)
print("贪婪模式:", matches_greedy)
# 输出: ['<p>这是第一个段落</p><p>这是第二个段落</p>']

# 勉强模式：尽可能少地匹配
pattern_lazy = r'<p>.*?</p>'
matches_lazy = re.findall(pattern_lazy, html)
print("勉强模式:", matches_lazy)
# 输出: ['<p>这是第一个段落</p>', '<p>这是第二个段落</p>']
```

### 案例 2：重复单词检测

使用后向引用检测文本中连续出现的重复单词。

```python
import re

text = "The the quick brown fox jumps over the the lazy dog."

# 捕获一个单词，然后匹配相同单词（忽略大小写）
pattern = r'\b(\w+)\s+\1\b'
matches = re.findall(pattern, text, re.IGNORECASE)
print("检测到的重复单词:", matches)
# 输出: ['The', 'the']

# 找出所有重复单词的位置
for match in re.finditer(pattern, text, re.IGNORECASE):
    print(f"重复单词 '{match.group(1)}' 出现在位置 {match.start()}")
```

### 案例 3：日志时间戳提取

从日志文件中提取时间戳信息。

```python
import re
from datetime import datetime

log = """
[2024-01-15 10:30:45] INFO: Application started
[2024-01-15 10:30:46] DEBUG: Loading configuration
[2024-01-15 10:30:47] ERROR: Connection failed
"""

# 提取时间戳和日志级别
pattern = r'\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]\s+(DEBUG|INFO|ERROR|WARN):\s+(.+?)$'

for match in re.finditer(pattern, log, re.MULTILINE):
    timestamp, level, message = match.groups()
    print(f"[{timestamp}] {level}: {message}")

# 输出:
# [2024-01-15 10:30:45] INFO: Application started
# [2024-01-15 10:30:46] DEBUG: Loading configuration
# [2024-01-15 10:30:47] ERROR: Connection failed
```

### 案例 4：邮箱和电话号码验证

使用正则表达式验证用户输入的邮箱和电话号码格式。

```python
import re

def validate_email(email):
    """验证邮箱格式"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone):
    """验证中国手机号码格式"""
    # 支持多种格式：13812345678, 138-1234-5678, (138) 1234 5678
    pattern = r'^1[3-9]\d{9}$|^1[3-9]\d-\d{4}-\d{4}$'
    return bool(re.match(pattern, phone))

# 测试
print(validate_email("user@example.com"))  # True
print(validate_email("invalid.email"))       # False
print(validate_phone("13812345678"))       # True
print(validate_phone("138-1234-5678"))     # True
```

### 案例 5：密码强度验证

使用正则表达式验证密码强度。

```python
import re

def validate_password(password):
    """
    密码必须包含：
    - 至少8个字符
    - 至少一个大写字母
    - 至少一个小写字母
    - 至少一个数字
    - 至少一个特殊字符
    """
    if len(password) < 8:
        return False, "密码长度至少8个字符"

    patterns = [
        (r'[A-Z]', "大写字母"),
        (r'[a-z]', "小写字母"),
        (r'\d', "数字"),
        (r'[!@#$%^&*(),.?":{}|<>]', "特殊字符")
    ]

    missing = []
    for pattern, name in patterns:
        if not re.search(pattern, password):
            missing.append(name)

    if missing:
        return False, f"密码缺少: {', '.join(missing)}"

    return True, "密码强度符合要求"

# 测试
print(validate_password("weak"))      # False
print(validate_password("Pass1234")) # False
print(validate_password("Pass1234!")) # True
```

## 总结

### 核心要点

本文详细介绍了 Python 正则表达式的高级特性：

1. **三种匹配模式**
   - **贪婪模式**：默认模式，尽可能多地匹配，匹配失败时会回溯
   - **勉强模式**：使用 `?` 后缀，尽可能少地匹配（也称为非贪婪）
   - **占有模式**：使用 `+` 后缀，不回溯，性能最佳

2. **分组捕获**
   - **捕获分组**：`()` 会将匹配内容存储到内存
   - **非捕获分组**：`(?:)` 不存储，提高性能
   - **命名分组**：`(?<name>)` 使用名称引用，便于维护

3. **高级特性**
   - **后向引用**：`\1`、`\2` 引用之前的分组
   - **原子分组**：`(?>)` 防止回溯
   - **零宽断言**：`(?=)`、`(?<=)` 等用于位置匹配

4. **Unicode 支持**
   - 多种字符表示方法：`\u`、`\x`、`\N{...}`
   - 完整的转义字符支持

### 性能优化建议

> **提示**：优先使用非捕获分组 `(?:)` 除非确实需要引用分组内容，这样可以减少内存占用并提高匹配速度。

**实用技巧**：
- 尽量使用具体的字符类而不是 `.*`
- 优先使用占有模式 `\++` 避免不必要的回溯
- 使用 `re.compile()` 预编译复杂模式
- 复杂的正则表达式添加注释提高可读性

### 相关资源

- [Python re 模块官方文档](https://docs.python.org/3/library/re.html)
- [正则表达式测试工具](https://regex101.com/)
- [RegexBuddy - Windows 正则表达式工具](https://www.regexbuddy.com/)

