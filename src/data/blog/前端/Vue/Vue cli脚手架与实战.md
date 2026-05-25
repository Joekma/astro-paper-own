---
title: 'Vue 3 脚手架与实战：create-vue、Vite、Router 与 Pinia'
series: Vue
seriesOrder: 5
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: vue3-create-vue-vite-router-pinia
featured: false
draft: false
tags:
  - Vue3
  - create-vue
  - Vite
  - Pinia
  - Vue Router
description: '使用 Vue 3 官方脚手架 create-vue 搭建项目，并结合 Vite、Vue Router 4、Pinia 完成常见业务实战。'
---

> Vue 3 新项目推荐使用 `create-vue` 创建 Vite 工程。它启动快、配置轻，并且天然支持 Vue Router 4、Pinia、TypeScript、Vitest 和 ESLint。

## 创建项目

```bash
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm run dev
```

创建时可以按项目需要选择：

| 选项 | 建议 |
|------|------|
| TypeScript | 中大型项目建议开启 |
| JSX | 只有明确需要 JSX 组件时开启 |
| Vue Router | 多页面或单页应用路由必选 |
| Pinia | 存在跨页面状态时建议开启 |
| Vitest | 需要单元测试时开启 |
| ESLint / Prettier | 团队项目建议开启 |

## 项目结构

```text
my-vue-app/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   └── counter.js
│   ├── views/
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
└── vite.config.js
```

常见目录职责：

- `components`：可复用组件。
- `views`：路由页面组件。
- `router`：路由表和导航守卫。
- `stores`：Pinia 状态模块。
- `assets`：图片、字体、全局样式等静态资源。

## 应用入口

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

`createApp` 会创建应用实例，`app.use()` 用于安装路由、状态库、UI 组件库等插件。

## 组件开发

Vue 3 推荐使用 `<script setup>` 编写单文件组件，它能减少样板代码，并让模板直接访问脚本中的变量和函数。

```vue
<script setup>
import { computed, ref } from 'vue'

const count = ref(0)
const label = computed(() => `当前计数：${count.value}`)

function increment() {
  count.value += 1
}
</script>

<template>
  <section class="counter">
    <p>{{ label }}</p>
    <button @click="increment">增加</button>
  </section>
</template>
```

## Vue Router 4

### 路由配置

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: () => import('../views/PostDetailView.vue'),
      props: true,
    },
  ],
})

export default router
```

### 页面跳转与参数读取

```vue
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const postId = computed(() => route.params.id)

function backHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <article>
    <h1>文章 {{ postId }}</h1>
    <button @click="backHome">返回首页</button>
  </article>
</template>
```

## Pinia 状态管理

Pinia 是 Vue 3 官方推荐的状态管理方案。它支持组合式写法、类型推断和模块拆分。

```javascript
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value += 1
  }

  return {
    count,
    doubleCount,
    increment,
  }
})
```

在组件中使用：

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <button @click="counter.increment">
    {{ counter.count }} / {{ counter.doubleCount }}
  </button>
</template>
```

## 实战：待办事项

### 状态模块

```javascript
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useTodoStore = defineStore('todo', () => {
  const todos = ref([
    { id: 1, title: '学习 Vue 3', done: true },
    { id: 2, title: '完成待办实战', done: false },
  ])

  const unfinishedCount = computed(
    () => todos.value.filter(todo => !todo.done).length
  )

  function addTodo(title) {
    const nextTitle = title.trim()

    if (!nextTitle) {
      return
    }

    todos.value.push({
      id: Date.now(),
      title: nextTitle,
      done: false,
    })
  }

  function removeTodo(id) {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }

  return {
    todos,
    unfinishedCount,
    addTodo,
    removeTodo,
  }
})
```

### 页面组件

```vue
<script setup>
import { ref } from 'vue'
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()
const todoTitle = ref('')

function submitTodo() {
  todoStore.addTodo(todoTitle.value)
  todoTitle.value = ''
}
</script>

<template>
  <section>
    <form @submit.prevent="submitTodo">
      <input v-model.trim="todoTitle" placeholder="输入待办事项" />
      <button type="submit">添加</button>
    </form>

    <p>未完成：{{ todoStore.unfinishedCount }}</p>

    <ul>
      <li v-for="todo in todoStore.todos" :key="todo.id">
        <label>
          <input v-model="todo.done" type="checkbox" />
          <span :class="{ done: todo.done }">{{ todo.title }}</span>
        </label>
        <button @click="todoStore.removeTodo(todo.id)">删除</button>
      </li>
    </ul>
  </section>
</template>
```

## 实战：登录流程

### 登录状态

```javascript
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => Boolean(user.value))

  async function login(account) {
    user.value = {
      id: 1,
      name: account.username,
    }
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
  }
})
```

### 登录页面

```vue
<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  username: '',
  password: '',
})

async function submitLogin() {
  await auth.login(form)
  router.replace({ name: 'home' })
}
</script>

<template>
  <form @submit.prevent="submitLogin">
    <input v-model.trim="form.username" autocomplete="username" />
    <input v-model="form.password" autocomplete="current-password" type="password" />
    <button type="submit">登录</button>
  </form>
</template>
```

## 构建与部署

```bash
npm run build
npm run preview
```

`npm run build` 会输出生产环境文件到 `dist`，`npm run preview` 可以在本地预览构建结果。

## 小结

- Vue 3 新项目使用 `create-vue` 和 Vite 创建。
- 应用入口通过 `createApp` 挂载，通过 `app.use()` 安装插件。
- 多页面导航使用 Vue Router 4，跨组件状态使用 Pinia。
- 业务组件优先使用 `<script setup>`、组合式函数和单文件组件组织代码。
