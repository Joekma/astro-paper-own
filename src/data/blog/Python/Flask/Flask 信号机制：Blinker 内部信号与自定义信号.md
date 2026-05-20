---
title: Flask 信号机制：Blinker 内部信号与自定义信号
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-6-signals
description: '深入讲解Flask信号机制，基于Blinker实现信号订阅与发布。介绍Flask内置的10个信号、自定义信号的创建与使用，以及信号与装饰器的区别对比。'
tags:
  - Python
  - Flask
  - 信号
  - Blinker
series: flask
seriesOrder: 5
draft: false
language: zh-CN
---

## 实例化补充

instance_path和instance_relative_config是配合来用的，这两个参数是用来找配置文件的，当用`app.config.from_pyfile('settings.py')`这种方式导入配置文件的时候会用到：

```python
from flask import Flask, request

app = Flask(__name__, instance_path=None, instance_relative_config=True)
app.config.from_pyfile('settings.py')
# instance_path：如果配置了instance_path，就会去找instance里面的文件
# instance_relative_config：如果设置为True，配置文件就找不到了，就会去找instance里面的settings.py

app.open_session
print(app.config.get("NNN"))

@app.route('/index')
def index():
    print(request)
    return "xx"

if __name__ == '__main__':
    app.__call__
    app.run()
```

如果设置了`instance_relative_config = True`，就找不着settings.py文件了，解决办法：就手动创建一个instance的文件夹。

![image](https://images2017.cnblogs.com/blog/1184802/201801/1184802-20180109145310301-542201739.png)

## 信号（blinker）

### Flask的内置信号

Flask框架中的信号基于blinker，其主要就是让开发者可以在flask请求过程中定制一些用户行为。信号通过发送通知来帮助你解耦应用。简言之，信号允许某个发送者通知接收者有事情发生了。

![image](https://images2017.cnblogs.com/blog/1184802/201801/1184802-20180109151241957-1838949184.png)

**10个信号：**

1. `request_started`：请求到来前执行
2. `request_finished`：请求结束后执行
3. `before_render_template`：模板渲染前执行
4. `template_rendered`：模板渲染后执行
5. `got_request_exception`：请求执行出现异常时执行
6. `request_tearing_down`：请求执行完毕后自动执行（无论成功与否）
7. `appcontext_tearing_down`：请求上下文执行完毕后自动执行（无论成功与否）
8. `appcontext_pushed`：请求app上下文push时执行
9. `appcontext_popped`：请求上下文pop时执行
10. `message_flashed`：调用flask在其中添加数据时，自动触发

**问题1：特殊的装饰器和信号有什么区别？**

- 触发信号是没有返回值的，写不写返回值都无所谓
- 特殊的装饰器对返回值是有意义的，当before_request有返回值时就不会执行后续视图函数了，没有返回值的时候才会执行后续函数，而after_request必须有返回值

所以特殊装饰器的功能比信号的功能强大。

**问题2：通过信号可以做权限吗？**

- 本身是做不了的，要想做得用其他的机制配合着来使用，这样做的话会很麻烦，所以我们选择中间件来做。

**问题3：信号用于做什么呢？**

- 只做一些自定义的操作，而且没有返回值
- 降低代码之间的耦合

### 自定义信号（Blinker的使用）

自定义信号的步骤：

1. 创建信号
2. 将函数注册到信号中（添加到信号列表）
3. 发送信号
4. 运行

具体实现：

```python
from flask import Flask, flash
from flask.signals import _signals

app = Flask(__name__)

# 创建信号
xinhao = _signals.signal("xinhao")

# 定义函数
def wahaha(*args, **kwargs):
    print("娃哈哈", args, kwargs)

def sww(*args, **kwargs):
    print("爽歪歪", args, kwargs)

# 将函数注册到信号中
xinhao.connect(wahaha)
xinhao.connect(sww)

@app.route("/zzz")
def zzz():
    # 触发这个信号，执行注册到列表中的所有函数
    # 这里的参数和上面函数的参数一致
    xinhao.send(sender='xxx', a1=123, a2=456)
    return "发送信号成功"

if __name__ == '__main__':
    app.run(debug=True)

# 打印结果
# 娃哈哈 (None,) {'sender': 'xxx', 'a1': 123, 'a2': 456}
# 爽歪歪 (None,) {'sender': 'xxx', 'a1': 123, 'a2': 456}
```

## chain模块简单的测试

```python
v1 = [11, 22, 33, 44]
v2 = [1, 4, 7, 5]

from itertools import chain

ff = []
for i in chain(v1, v2):  # chain会把两个列表连接在一块
    ff.append(i)

print(ff)  # [11, 22, 33, 44, 1, 4, 7, 5]
```
