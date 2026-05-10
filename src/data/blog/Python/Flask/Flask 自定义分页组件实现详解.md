---
title: Flask 自定义分页组件实现详解
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: flask-5-pagination
description: '详细讲解 Flask 自定义分页组件的实现原理，包括 Pagination 类的设计、页码计算逻辑、分页 HTML 生成方法以及在 Flask 中的实际使用示例'
tags:
  - Python
  - Flask
  - 分页
  - 组件
category: Flask
series: flask
draft: false
language: zh-CN
---

## Flask实现的分页组件

```python
from urllib.parse import urlencode, quote, unquote

class Pagination(object):
    """
    自定义分页
    """
    def __init__(self, current_page, total_count, base_url, params, per_page_count=10, max_pager_count=11):
        try:
            current_page = int(current_page)
        except Exception as e:
            current_page = 1

        if current_page <= 0:
            current_page = 1

        self.current_page = current_page
        self.total_count = total_count
        self.per_page_count = per_page_count

        # 页面上应该显示的最大页码
        max_page_num, div = divmod(total_count, per_page_count)
        if div:
            max_page_num += 1
        self.max_page_num = max_page_num

        # 页面上默认显示11个页码（当前页在中间）
        self.max_pager_count = max_pager_count
        self.half_max_pager_count = int((max_pager_count - 1) / 2)

        # URL前缀
        self.base_url = base_url

        # request.GET
        import copy
        params = copy.deepcopy(params)
        get_dict = params.to_dict()
        self.params = get_dict

    @property
    def start(self):
        return (self.current_page - 1) * self.per_page_count

    @property
    def end(self):
        return self.current_page * self.per_page_count

    def page_html(self):
        # 如果总页数 <= 11
        if self.max_page_num <= self.max_pager_count:
            pager_start = 1
            pager_end = self.max_page_num
        # 如果总页数 > 11
        else:
            # 如果当前页 <= 5
            if self.current_page <= self.half_max_pager_count:
                pager_start = 1
                pager_end = self.max_pager_count
            else:
                # 当前页 + 5 > 总页码
                if (self.current_page + self.half_max_pager_count) > self.max_page_num:
                    pager_end = self.max_page_num
                    pager_start = self.max_page_num - self.max_pager_count + 1
                else:
                    pager_start = self.current_page - self.half_max_pager_count
                    pager_end = self.current_page + self.half_max_pager_count

        page_html_list = []

        # 首页
        self.params['page'] = 1
        first_page = '<li><a href="%s?%s">首页</a></li>' % (self.base_url, urlencode(self.params),)
        page_html_list.append(first_page)

        # 上一页
        self.params["page"] = self.current_page - 1
        if self.params["page"] < 1:
            pervious_page = '<li class="disabled"><a href="%s?%s" aria-label="Previous">上一页</span></a></li>' % (self.base_url, urlencode(self.params))
        else:
            pervious_page = '<li><a href="%s?%s" aria-label="Previous">上一页</span></a></li>' % (self.base_url, urlencode(self.params))
        page_html_list.append(pervious_page)

        # 中间页码
        for i in range(pager_start, pager_end + 1):
            self.params['page'] = i
            if i == self.current_page:
                temp = '<li class="active"><a href="%s?%s">%s</a></li>' % (self.base_url, urlencode(self.params), i,)
            else:
                temp = '<li><a href="%s?%s">%s</a></li>' % (self.base_url, urlencode(self.params), i,)
            page_html_list.append(temp)

        # 下一页
        self.params["page"] = self.current_page + 1
        if self.params["page"] > self.max_page_num:
            self.params["page"] = self.current_page
            next_page = '<li class="disabled"><a href="%s?%s" aria-label="Next">下一页</span></a></li>' % (self.base_url, urlencode(self.params))
        else:
            next_page = '<li><a href="%s?%s" aria-label="Next">下一页</span></a></li>' % (self.base_url, urlencode(self.params))
        page_html_list.append(next_page)

        # 尾页
        self.params['page'] = self.max_page_num
        last_page = '<li><a href="%s?%s">尾页</a></li>' % (self.base_url, urlencode(self.params),)
        page_html_list.append(last_page)

        return ''.join(page_html_list)
```

## 使用组件

```python
#!usr/bin/env python
# -*- coding:utf-8 -*-
from flask import Flask, render_template, request, redirect
from pager import Pagination
from urllib.parse import urlencode

app = Flask(__name__)

# =========================django的用法=======================================
# pager_obj = Pagination(request.GET.get('page', 1), len(HOST_LIST), request.path_info, request.GET)
# host_list = HOST_LIST[pager_obj.start:pager_obj.end]
# html = pager_obj.page_html()
# return render(request, 'hosts.html', {'host_list': host_list, "page_html": html})

@app.route('/pager')
def pager():
    li = []
    for i in range(1, 100):
        li.append(i)

    # ===============================flask的用法===============================
    pager_obj = Pagination(request.args.get("page", 1), len(li), request.path, request.args, per_page_count=10)

    index_list = li[pager_obj.start:pager_obj.end]
    html = pager_obj.page_html()
    return render_template("pager.html", index_list=index_list, html=html, condition=request.path)

if __name__ == '__main__':
    app.run(debug=True)
```

pager.html模板：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width">
    <title>Title</title>
    <link rel="stylesheet" href="/static/bootstrap-3.3.7-dist/css/bootstrap.min.css">
    <style>
        .container {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/add?{{ condition }}"><button class="btn btn-primary">添加</button></a>
        <div class="row" style="margin-top: 10px">
            <ul>
                {% for foo in index_list %}
                    <li>{{ foo }}</li>
                {% endfor %}
            </ul>
            <nav aria-label="Page navigation" class="pull-right">
                <ul class="pagination">
                    {{ html|safe }}
                </ul>
            </nav>
        </div>
    </div>
</body>
</html>
```
