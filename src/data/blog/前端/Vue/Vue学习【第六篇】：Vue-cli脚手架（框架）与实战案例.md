---
title: Vue-cli脚手架与实战
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
updated: 2026-04-22T00:00:00.000+08:00
slug: vue-cli-scaffolding-tutorial
description: 'Vue CLI脚手架使用，包括项目创建、组件开发、路由配置和实战案例'
tags:
  - Vue
  - Vue CLI
  - 前端
  - 脚手架
category: 前端
draft: false
language: zh-CN
---

> Vue CLI 是 Vue.js 官方提供的脚手架工具，用于快速搭建 Vue 项目。

## 安装

```bash
npm install -g @vue/cli
vue --version
```

## 创建项目

```bash
vue create my-project
cd my-project
npm run serve
```

### 选择配置

```
? Please pick a preset: (Use arrow keys)
  Default ([Vue 3] babel, eslint)
  Default ([Vue 2] babel, eslint)
  Manually select features  // 选择这个可以自定义
```

### 手动选择

```
? Check the features needed for your project:
  ◉ Choose Vue version
  ◉ Babel
  ◉ TypeScript
  ◉ Progressive Web App (PWA) Support
  ◉ Router
  ◉ Vuex
  ◉ CSS Pre-processors
  ◉ Linter / Formatter
  ◉ Unit Testing
  ◉ E2E Testing
```

## 项目结构

```
my-project/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   ├── components/
│   ├── views/
│   ├── router/
│   │   └── index.js
│   ├── store/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── package.json
└── vue.config.js
```

## 组件开发

### 创建组件

```vue
<!-- src/components/HelloWorld.vue -->
<template>
    <div class="hello">
        <h1>{{ msg }}</h1>
        <p>{{ count }}</p>
        <button @click="increment">+1</button>
    </div>
</template>

<script>
export default {
    name: 'HelloWorld',
    props: {
        msg: {
            type: String,
            default: 'Hello'
        }
    },
    data() {
        return {
            count: 0
        }
    },
    methods: {
        increment() {
            this.count++
        }
    }
}
</script>

<style scoped>
.hello {
    color: #42b983;
}
</style>
```

## 路由配置

### 安装

```bash
npm install vue-router
```

### 路由文件

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import About from '@/views/About.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        component: About
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
```

### 路由跳转

```vue
<template>
    <div>
        <router-link to="/">首页</router-link>
        <router-link to="/about">关于</router-link>
        
        <router-view></router-view>
    </div>
</template>

<script>
export default {
    name: 'App'
}
</script>
```

## 路由进阶

### 动态路由

```javascript
{
    path: '/user/:id',
    name: 'User',
    component: User
}

// 获取参数
this.$route.params.id
```

### 嵌套路由

```javascript
{
    path: '/user',
    component: UserLayout,
    children: [
        { path: 'profile', component: UserProfile },
        { path: 'settings', component: UserSettings }
    ]
}
```

### 导航守卫

```javascript
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')
    
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else {
        next()
    }
})
```

## 状态管理 Vuex

### 安装

```bash
npm install vuex
```

### Store 配置

```javascript
// src/store/index.js
import { createStore } from 'vuex'

export default createStore({
    state: {
        user: null,
        todos: []
    },
    mutations: {
        SET_USER(state, user) {
            state.user = user
        },
        ADD_TODO(state, todo) {
            state.todos.push(todo)
        }
    },
    actions: {
        async login({ commit }, credentials) {
            const user = await api.login(credentials)
            commit('SET_USER', user)
        }
    },
    getters: {
        isLoggedIn: state => !!state.user
    }
})
```

## 实战案例

### Todo 应用

```vue
<!-- src/views/Todo.vue -->
<template>
    <div class="todo">
        <h1>待办事项</h1>
        
        <input 
            v-model="newTodo" 
            @keyup.enter="addTodo"
            placeholder="添加新任务"
        />
        
        <ul>
            <li v-for="todo in todos" :key="todo.id">
                <input 
                    type="checkbox" 
                    v-model="todo.done"
                />
                <span :class="{ done: todo.done }">
                    {{ todo.text }}
                </span>
                <button @click="removeTodo(todo.id)">删除</button>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
            newTodo: '',
            todos: []
        }
    },
    methods: {
        addTodo() {
            if (!this.newTodo.trim()) return
            
            this.todos.push({
                id: Date.now(),
                text: this.newTodo,
                done: false
            })
            this.newTodo = ''
        },
        removeTodo(id) {
            this.todos = this.todos.filter(t => t.id !== id)
        }
    }
}
</script>

<style scoped>
.done {
    text-decoration: line-through;
}
</style>
```

### 用户登录

```vue
<template>
    <div class="login">
        <form @submit.prevent="handleLogin">
            <input v-model="form.username" placeholder="用户名" />
            <input v-model="form.password" type="password" placeholder="密码" />
            <button type="submit">登录</button>
        </form>
    </div>
</template>

<script>
export default {
    data() {
        return {
            form: {
                username: '',
                password: ''
            }
        }
    },
    methods: {
        async handleLogin() {
            try {
                await this.$store.dispatch('login', this.form)
                this.$router.push('/')
            } catch (error) {
                alert('登录失败')
            }
        }
    }
}
</script>
```

## 小结

- **Vue CLI**：快速搭建项目
- **项目结构**：components、views、router、store
- **组件开发**：template、script、style
- **路由**：vue-router 配置和导航守卫
- **状态**：Vuex store 管理应用状态
- **实战**：Todo 应用和登录功能示例
