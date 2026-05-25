---
title: Ajax技术原理与实战应用
author: Joekma
pubDatetime: 2019-02-18T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: ajax-deep-analysis-and-practical-applications
featured: false
draft: false
tags:
  - JavaScript
  - 前端开发
  - Ajax
  - Fetch API
  - HTTP请求
  - axios
  - Web开发
description: '深入剖析Ajax技术原理，包含XMLHttpRequest、Fetch API、Promise封装、axios使用等，涵盖异步编程、错误处理和实际应用场景'
series: JavaScript
seriesOrder: 4
language: zh-CN
---

> Ajax（异步 JavaScript 和 XML）用于在不刷新页面的情况下与服务器交换数据。

## Ajax 简介

### 什么是 Ajax

**Ajax** = Asynchronous JavaScript and XML

- **异步**：请求和响应可以同时进行
- **无刷新**：页面不刷新即可更新内容
- **跨域通信**：可与不同域的服务器通信

### 应用场景

| 场景 | 说明 |
|------|------|
| 表单验证 | 用户名校验、邮箱格式验证 |
| 搜索提示 | 实时搜索建议 |
| 无限滚动 | 懒加载内容 |
| 点赞/评论 | 无刷新交互 |
| 数据提交 | 异步表单提交 |

## XMLHttpRequest

### 基本用法

```javascript
// 创建请求
const xhr = new XMLHttpRequest();

// 配置请求
xhr.open('GET', '/api/users', true);

// 发送请求
xhr.send();

// 处理响应
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log(data);
    }
};
```

### readyState 状态

| 值 | 状态 | 说明 |
|------|------|------|
| 0 | UNSENT | 请求未初始化 |
| 1 | OPENED | 服务器连接已建立 |
| 2 | HEADERS_RECEIVED | 已接收到响应头 |
| 3 | LOADING | 响应体下载中 |
| 4 | DONE | 请求完成 |

### GET 请求

```javascript
function getUser(id) {
    const xhr = new XMLHttpRequest();
    
    xhr.open('GET', `/api/users/${id}`, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const user = JSON.parse(xhr.responseText);
            console.log(user);
        }
    };
    
    xhr.send();
}
```

### POST 请求

```javascript
function createUser(userData) {
    const xhr = new XMLHttpRequest();
    
    xhr.open('POST', '/api/users', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = function() {
        if (xhr.status === 201) {
            const newUser = JSON.parse(xhr.responseText);
            console.log('创建成功:', newUser);
        }
    };
    
    xhr.send(JSON.stringify(userData));
}
```

### 设置请求头

```javascript
xhr.open('POST', '/api/upload', true);

// 设置内容类型
xhr.setRequestHeader('Content-Type', 'application/json');

// 设置认证令牌
xhr.setRequestHeader('Authorization', 'Bearer token123');

// 设置接受数据类型
xhr.setRequestHeader('Accept', 'application/json');
```

### 上传文件

```javascript
function uploadFile(file) {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    
    xhr.open('POST', '/api/upload', true);
    
    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            console.log(`上传进度: ${percent}%`);
        }
    };
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log('上传成功');
        }
    };
    
    xhr.send(formData);
}
```

## Fetch API

### 基本用法

```javascript
// GET 请求
fetch('/api/users')
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));

// POST 请求
fetch('/api/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: '张三', age: 25 })
})
    .then(response => response.json())
    .then(data => console.log(data));
```

### async/await 用法

```javascript
async function getUsers() {
    try {
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### Fetch 选项

```javascript
const options = {
    method: 'GET',                    // 请求方法
    headers: {                        // 请求头
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
    },
    body: JSON.stringify(data),      // 请求体
    mode: 'cors',                     // 模式：cors, no-cors, same-origin
    cache: 'no-cache',               // 缓存模式
    credentials: 'include',          // 凭证：omit, same-origin, include
    redirect: 'follow',              // 重定向：follow, error, manual
};

fetch('/api/users', options)
    .then(response => response.json());
```

### 错误处理

```javascript
async function fetchData() {
    try {
        const response = await fetch('/api/data');
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
    }
}
```

## Promise 封装

### promiseAjax 函数

```javascript
function promiseAjax(url, options = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        const defaultOptions = {
            method: 'GET',
            data: null,
            headers: {},
            timeout: 10000
        };
        
        const config = { ...defaultOptions, ...options };
        
        xhr.open(config.method, url, true);
        
        // 设置请求头
        Object.keys(config.headers).forEach(key => {
            xhr.setRequestHeader(key, config.headers[key]);
        });
        
        // 超时处理
        xhr.timeout = config.timeout;
        xhr.ontimeout = () => reject(new Error('请求超时'));
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(`请求失败: ${xhr.status}`));
            }
        };
        
        xhr.onerror = () => reject(new Error('网络错误'));
        
        xhr.send(config.data);
    });
}

// 使用
promiseAjax('/api/users', {
    method: 'POST',
    data: JSON.stringify({ name: '张三' }),
    headers: { 'Content-Type': 'application/json' }
})
.then(data => console.log(data))
.catch(error => console.error(error));
```

## jQuery Ajax

### \$.ajax

```javascript
$.ajax({
    url: '/api/users',
    method: 'POST',
    data: { name: '张三', age: 25 },
    dataType: 'json',
    success: function(data) {
        console.log(data);
    },
    error: function(xhr, status, error) {
        console.error('Error:', error);
    }
});
```

### \$.get / \$.post

```javascript
// GET 请求
$.get('/api/users', function(data) {
    console.log(data);
});

// POST 请求
$.post('/api/users', {
    name: '张三',
    age: 25
}, function(data) {
    console.log(data);
});
```

## axios 库

### 安装和使用

```bash
npm install axios
```

```javascript
import axios from 'axios';

// GET 请求
axios.get('/api/users')
    .then(response => console.log(response.data));

// POST 请求
axios.post('/api/users', {
    name: '张三',
    age: 25
})
.then(response => console.log(response.data));
```

### async/await 用法

```javascript
async function getUsers() {
    try {
        const response = await axios.get('/api/users');
        return response.data;
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### 请求配置

```javascript
axios({
    method: 'POST',
    url: '/api/users',
    data: { name: '张三' },
    timeout: 5000,
    headers: { 'Authorization': 'Bearer token' }
});
```

## 小结

- **XMLHttpRequest**：原生 Ajax API
- **Fetch API**：现代替代方案，支持 Promise
- **axios**：最流行的 HTTP 库
- **常见应用**：表单验证、搜索提示、异步提交
- **错误处理**：注意网络错误、服务器错误、超时处理
