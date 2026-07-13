---
title: Python 常用模块：shutil、json、pickle、shelve、xml、configparser
author: Joekma
pubDatetime: 2018-10-17T00:00:00.000+08:00
modDatetime: 2026-07-11T00:00:00.000+08:00
slug: python-common-modules-serializtion-config
description: '深入讲解Python常用模块：文件操作、序列化和配置文件处理。'
tags:
  - Python
  - shutil
  - json
  - pickle
  - shelve
  - xml
  - configparser
draft: false
series: python
seriesOrder: 15
language: zh-CN
---

> Python 提供了丰富的标准模块来处理文件操作、序列化和配置文件。本文将详细介绍 shutil、json、pickle、shelve、xml 和 configparser 等常用模块的使用方法。

![Python 文件与数据模块 shutil、json、pickle、shelve、xml 和 configparser 可以分别用于文件操作、压缩归档、序列化、持久化和配置读取](./images/python-file-serialization-config-modules-figure-01.png)

## shutil 与安全归档

`shutil` 适合复制、移动、删除和创建归档。所有路径先解析到预期根目录内；递归删除前再次确认目标，避免把空变量或父目录当成删除目标。

解压来自外部的 ZIP/TAR 时不能直接调用无检查的批量解压。先限制成员数量和总大小，再验证每个成员解析后的路径仍位于目标目录；符号链接和设备文件默认拒绝。

<!-- snippet: id=python-safe-zip-extraction mode=run python=3.12-3.14 deps=stdlib -->
```python
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile

def safe_extract_zip(archive: Path, destination: Path, *, max_bytes: int = 1_000_000) -> None:
    root = destination.resolve()
    with ZipFile(archive) as zf:
        infos = zf.infolist()
        if len(infos) > 100 or sum(item.file_size for item in infos) > max_bytes:
            raise ValueError("archive is too large")
        for item in infos:
            target = (root / item.filename).resolve()
            if not target.is_relative_to(root):
                raise ValueError("archive member escapes destination")
        zf.extractall(root)

with TemporaryDirectory() as tmp:
    root = Path(tmp)
    archive = root / "example.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as zf:
        zf.writestr("docs/readme.txt", "safe")
    out = root / "out"
    safe_extract_zip(archive, out)
    assert (out / "docs/readme.txt").read_text() == "safe"
```

## JSON 与 pickle 的信任边界

JSON 只表示字符串、数字、布尔值、空值、数组和对象，适合作为跨进程/跨语言交换格式。解析后仍要验证结构、字段类型、数值范围和输入大小。

<!-- snippet: id=python-json-validated-roundtrip mode=run python=3.12-3.14 deps=stdlib -->
```python
import json

text = '{"name": "Ada", "roles": ["reader"]}'
data = json.loads(text)
if not isinstance(data.get("name"), str) or not all(
    isinstance(role, str) for role in data.get("roles", [])
):
    raise ValueError("invalid payload")

encoded = json.dumps(data, ensure_ascii=False, sort_keys=True)
assert json.loads(encoded) == data
```

`pickle` 能在反序列化时导入模块并调用对象构造逻辑，因此加载恶意数据可能直接执行代码。它只适用于同一信任域内、由当前应用自己生成并完整保护的数据；不得读取上传文件、Cookie、缓存中的不可信值或网络消息。`shelve` 内部同样使用 pickle，信任边界完全相同。

如果只需要保存普通数据，选择 JSON；需要带 schema 的跨系统协议时选择明确的序列化格式并验证 schema。不要把“签名了 pickle”当成长期存储设计：密钥泄露、算法迁移和对象代码变化都会放大风险。

## shelve 模块

`shelve` 类似字典，可以直接对数据进行修改。

<!-- snippet: id=python-common-modules-serializtion-config-10 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import shelve

user = {"name": "高根"}

# 写入
s = shelve.open("userdb.shv")
s["user"] = user
s.close()

# 修改（需要 writeback=True）
s = shelve.open("userdb.shv", writeback=True)
print(s["user"])
s["user"]["age"] = 20
s.close()
```

## xml 模块

XML 是实现不同语言或程序之间数据交换的协议。

<!-- snippet: id=python-common-modules-serializtion-config-11 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import xml.etree.ElementTree as ET

# 解析 XML 文件
tree = ET.parse("d.xml")
root = tree.getroot()

# 获取所有人的年龄
for item in root.iter("age"):
    print(item.tag)      # 标签名称
    print(item.attrib)   # 标签的属性
    print(item.text)     # 文本内容

# find：找到第一个
print(root.find("age").attrib)

# findall：找到所有
print(root.findall("age"))

# 获取属性
stu = root.find("stu")
print(stu.get("age"))
print(stu.get("name"))

# 删除子标签
root.remove(stu)

# 添加子标签
newTag = ET.Element("新标签", {"属性": "值"})
root.append(newTag)

# 写入文件
tree.write("f.xml", encoding="utf-8")
```

### 创建 XML 文档

<!-- snippet: id=python-common-modules-serializtion-config-12 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import xml.etree.ElementTree as ET

new_xml = ET.Element("namelist")
name = ET.SubElement(new_xml, "name", attrib={"enrolled": "yes"})
age = ET.SubElement(name, "age", attrib={"checked": "no"})
sex = ET.SubElement(name, "sex")
sex.text = '33'

et = ET.ElementTree(new_xml)
et.write("test.xml", encoding="utf-8", xml_declaration=True)
```

## configparser 模块

`configparser` 用于处理配置文件，格式类似 Windows INI 文件。

### 配置文件示例

<!-- snippet: id=python-common-modules-serializtion-config-13 mode=display python=3.12-3.14 deps=stdlib -->
```ini
[db]
db_port = 3306
db_user = root
db_host = 127.0.0.1
db_pass = xgmtest

[concurrent]
processor = 20
thread = 10
```

### 读取配置

<!-- snippet: id=python-common-modules-serializtion-config-14 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import configparser

config = configparser.ConfigParser()
config.read('a.cfg')

# 查看所有标题
print(config.sections())

# 查看标题下的所有 key
print(config.options('section1'))

# 查看所有 key-value
print(config.items('section1'))

# 获取值
print(config.get('section1', 'user'))
print(config.getint('section1', 'age'))
print(config.getboolean('section1', 'is_admin'))
```

### 修改配置

<!-- snippet: id=python-common-modules-serializtion-config-15 mode=compile python=3.12-3.14 deps=stdlib -->
```python
import configparser

config = configparser.ConfigParser()
config.read('a.cfg', encoding='utf-8')

# 删除标题
config.remove_section('section2')

# 删除选项
config.remove_option('section1', 'k1')

# 判断是否存在
print(config.has_section('section1'))
print(config.has_option('section1', 'user'))

# 添加标题和选项
config.add_section('egon')
config.set('egon', 'name', 'egon')
config.set('egon', 'age', '18')  # 必须是字符串

# 写入文件
config.write(open('a.cfg', 'w'))
```

## 小结

| 模块 | 用途 | 跨平台 |
|------|------|--------|
| **shutil** | 高级文件/文件夹操作 | 是 |
| **json** | 序列化（标准格式） | 是 |
| **pickle** | 序列化（Python 专用） | 否 |
| **shelve** | 持久化字典 | 否 |
| **xml** | XML 解析 | 是 |
| **configparser** | 配置文件处理 | 是 |

掌握这些模块的使用，可以帮助你更好地处理文件操作、数据序列化和配置管理。
