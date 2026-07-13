---
title: Django 与 Ajax 异步交互
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-07-11T00:00:00.000+08:00
slug: django-ajax
featured: false
draft: false
series: django
seriesOrder: 19
tags:
  - Python
  - Django
  - Ajax
description: "深入讲解Django与Ajax异步交互的实现方法和应用场景。"
---

## Fetch、JSON 与 CSRF

Ajax 只是浏览器在不整页跳转的情况下发起 HTTP 请求。服务端仍需做认证、授权、CSRF、大小限制和数据验证；前端字段不可信。

<!-- snippet: id=django-fetch-csrf mode=display python=3.12-3.14 deps=stdlib -->
```javascript
const response = await fetch("/api/profile/", {
  method: "POST",
  headers: {"Content-Type": "application/json", "X-CSRFToken": csrfToken},
  credentials: "same-origin",
  body: JSON.stringify({display_name: "Ada"}),
});
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

<!-- snippet: id=django-json-view-safe mode=project python=3.12-3.14 deps=Django==6.0.7 file=profiles/views.py -->
```python
import json
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@login_required
@require_POST
def update_profile(request):
    if len(request.body) > 16_384:
        return JsonResponse({"error": "payload too large"}, status=413)
    try:
        payload = json.loads(request.body)
    except (UnicodeDecodeError, json.JSONDecodeError):
        return JsonResponse({"error": "invalid json"}, status=400)
    name = payload.get("display_name")
    if not isinstance(name, str) or not 1 <= len(name) <= 80:
        return JsonResponse({"error": "invalid display_name"}, status=400)
    request.user.first_name = name
    request.user.save(update_fields=["first_name"])
    return JsonResponse({"display_name": name})
```

上传使用 `request.FILES`，同时限制请求大小、扩展名、探测后的媒体类型和图片像素；文件名由服务端重新生成并存到不可执行位置。下载时再设置安全的 `Content-Disposition`。测试客户端需覆盖缺失 CSRF、未登录、错误 JSON、超限正文和重复请求。
