---
title: 前端安全：XSS、CSP 与可信输入
author: Joekma
pubDatetime: 2026-05-15T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: frontend-security-xss-csp-trusted-input
description: '系统梳理前端 XSS 风险、输入输出边界、CSP 配置和安全编码习惯。'
tags:
  - JavaScript
  - 前端安全
  - XSS
  - CSP
  - Web开发
draft: false
series: JavaScript
language: zh-CN
---

前端安全的核心不是“把所有危险 API 都记住”，而是建立边界意识：**用户输入不可信、外部内容不可信、展示到页面前必须经过合适的处理**。

## XSS 类型

### 存储型 XSS

攻击内容被保存到数据库，其他用户访问页面时执行。常见于评论、昵称、富文本内容。

```javascript
// 危险：把未清理的评论内容直接写入页面。
commentList.innerHTML = serverCommentHtml
```

### 反射型 XSS

攻击内容来自 URL、搜索参数或表单提交，服务端或前端把它直接反射到页面。

```javascript
// 危险：URL 参数可被攻击者构造。
const keyword = new URLSearchParams(location.search).get('q')
resultTitle.innerHTML = `搜索：${keyword}`
```

### DOM 型 XSS

漏洞完全发生在浏览器端，常见入口是 `location.hash`、`postMessage`、本地存储和第三方脚本返回值。

```javascript
// 危险：hash 内容同样属于不可信输入。
const tab = location.hash.slice(1)
document.querySelector('#content').innerHTML = tab
```

## 安全输出

### 优先使用 textContent

```javascript
const keyword = new URLSearchParams(location.search).get('q') ?? ''

// 安全：浏览器会把内容当作文本，而不是 HTML。
resultTitle.textContent = `搜索：${keyword}`
```

### 必须展示 HTML 时先清理

```javascript
import DOMPurify from 'dompurify'

const dirtyHtml = await fetchArticleHtml()

// 只允许白名单标签和属性进入页面。
const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code'],
  ALLOWED_ATTR: ['href', 'title'],
})

articleBody.innerHTML = cleanHtml
```

## CSP 防护

CSP（Content Security Policy）可以限制页面允许加载和执行的资源来源。它不是替代编码规范的万能药，但能显著降低 XSS 成功后的破坏面。

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none';
```

## 危险 API 清单

| API | 风险 | 替代方案 |
|-----|------|----------|
| `innerHTML` | 执行注入的 HTML/事件属性 | `textContent` 或 DOMPurify |
| `eval` | 执行任意字符串代码 | 函数映射、JSON 配置 |
| `new Function` | 同 `eval` | 显式函数 |
| `setTimeout(string)` | 字符串会被当作代码 | `setTimeout(() => {})` |
| `document.write` | 覆盖文档并注入内容 | DOM API |

## 表单和请求安全

```javascript
async function submitProfile(form) {
  const formData = new FormData(form)

  // 前端校验用于体验，真正的安全校验必须在服务端再做一次。
  if (!formData.get('nickname')) {
    throw new Error('昵称不能为空')
  }

  return fetch('/api/profile', {
    method: 'POST',
    credentials: 'include',
    headers: {
      // CSRF Token 通常由服务端模板或安全接口下发。
      'X-CSRF-Token': window.__CSRF_TOKEN__,
    },
    body: formData,
  })
}
```

## 最佳实践

- 默认把 URL、表单、本地存储、接口返回、第三方 SDK 回调都当作不可信输入。
- 展示文本用 `textContent`；展示富文本先做白名单清理。
- 禁止字符串形式的 `eval`、`new Function`、`setTimeout`、`setInterval`。
- 给生产站点加 CSP，并从 `Content-Security-Policy-Report-Only` 开始灰度。
- Token 不要放在可被脚本读取的长期存储里，敏感 Cookie 使用 `HttpOnly`、`Secure`、`SameSite`。

## 小结

前端安全最重要的是守住输入和输出边界。代码层面避免危险 API，运行时用 CSP 限制资源执行，再配合服务端校验、CSRF 防护和安全 Cookie，才能形成完整防线。
