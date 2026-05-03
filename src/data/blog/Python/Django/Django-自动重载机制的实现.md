---
title: Django 自动重载机制的实现
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: django-autoreload-mechanism
featured: false
draft: false
tags:
  - Python
  - Django
  - 自动重载
description: "深入讲解Django自动重载机制的实现原理和工作方式。"
---

## 两个进程

关于重载的实现方式在`django/utils/autoreload.py`中，重启的设置在`python_reloader`函数中：

```python
def restart_with_reloader():
    while True:
        args = [sys.executable] + ['-W%s' % o for o in sys.warnoptions] + sys.argv
        if sys.platform == "win32":
            args = ['"%s"' % arg for arg in args]
        new_environ = os.environ.copy()
        new_environ["RUN_MAIN"] = 'true'
        exit_code = os.spawnve(os.P_WAIT, sys.executable, args, new_environ)
        if exit_code != 3:
            return exit_code

def python_reloader(main_func, args, kwargs):
    if os.environ.get("RUN_MAIN") == "true":
        thread.start_new_thread(main_func, args, kwargs)
        try:
            reloader_thread()
        except KeyboardInterrupt:
            pass
    else:
        try:
            exit_code = restart_with_reloader()
            if exit_code < 0:
                os.kill(os.getpid(), -exit_code)
            else:
                sys.exit(exit_code)
        except KeyboardInterrupt:
            pass
```

`python_reloader`会判断是否设置了`RUN_MAIN`为True。开始时，是没有这个环境变量的，因此程序走`else`代码块。而在`restart_with_reloader`中，就设置了这个环境变量`new_environ["RUN_MAIN"] = 'true'`。

精彩的部分到了，在新的环境变量中，用`os.spawnve`启动新子进程，而这个子进程运行的正是当前的命令（`python manage.py runserver`），现在`RUN_MAIN`为True了，执行`thread.start_new_thread(main_func, args, kwargs)`，也就是启动了一个server。

如果子进程不退出，就一直停在`os.spawnve`这一步；如果子进程退出，而退出码不是3，`while`就被终结了；如果是3，继续循环，重新创建子进程。

在此可以得出，django的autoreload机制中，主进程其实也没做什么事，就是监控子进程的运行，如果子进程退出码是3，继续创建子进程。但目前为止，似乎还缺少文件监听的部分，这部分应该就在`reloader_thread()`中。

## 文件监控与子进程重启

```python
def reloader_thread():
    ensure_echo_on()
    if USE_INOTIFY:
        fn = inotify_code_changed
    else:
        fn = code_changed
    while RUN_RELOADER:
        change = fn()
        if change == FILE_MODIFIED:
            sys.exit(3)  # force reload
        elif change == I18N_MODIFIED:
            reset_translations()
        time.sleep(1)
```

在`ensure_echo_on()`中，先判断是否成功导入`termios`模块，这个模块是unix平台的控制通信端口的，具体怎么控制不怎么懂，这个win上是没有的。经过跟踪`USE_INOTIFY`这个值是为`False`，因此判断是否文件是否修改是`code_changed`函数。

```python
def code_changed():
    global _mtimes, _win
    for filename in gen_filenames():
        stat = os.stat(filename)
        mtime = stat.st_mtime
        if _win:
            mtime -= stat.st_ctime
        if filename not in _mtimes:
            _mtimes[filename] = mtime
            continue
        if mtime != _mtimes[filename]:
            _mtimes = {}
            try:
                del _error_files[_error_files.index(filename)]
            except ValueError:
                pass
            return I18N_MODIFIED if filename.endswith('.mo') else FILE_MODIFIED
    return False
```

这样就清楚了，根据每个文件的最后修改时间来判断文件是否被修改，如果修改，`code_changed()`返回True。上一层函数就执行`sys.exit(3)`退出子进程。然后主进程监控到子进程的退出码为3，就会重新建立新的子进程。监听文件修改的线程每1秒钟执行一次。

## 总结

使用环境变量巧妙的建立两个进程：

- **主进程**：负责监控子进程和创建新的进程
- **子进程**：用来执行命令，子进程中创建子线程来监控文件的修改，如果有修改，退出子进程

不知为何不能把监控文件的放在主进程中做呢，每个子进程都要再创建这个监控，多累啊，主进程不能控制子进程退出吗？