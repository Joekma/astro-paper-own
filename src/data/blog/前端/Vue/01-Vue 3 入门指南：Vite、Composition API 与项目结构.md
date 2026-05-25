---
title: Vue 3 入门指南：Vite、Composition API 与项目结构
author: Joekma
pubDatetime: 2026-05-15T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: vue3-vite-composition-api-getting-started
featured: false
draft: false
tags:
  - Vue
  - Vue 3
  - Vite
  - Composition API
  - 前端
description: '基于 Vue 3 当前生态，讲解 create-vue、Vite、script setup、响应式状态和项目结构。'
series: Vue
seriesOrder: 1
language: zh-CN
---

Vue 3 新项目通常从 `create-vue` 开始，它基于 Vite，默认支持单文件组件、快速热更新和现代构建流程。

## 创建项目

```bash
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm run dev
```

创建时可以按需要选择 TypeScript、Vue Router、Pinia、Vitest、ESLint、Prettier。

## 项目结构

```text
src/
  assets/
  components/
  composables/
  router/
  stores/
  views/
  App.vue
  main.js
```

| 目录 | 作用 |
|------|------|
| `components` | 通用组件 |
| `views` | 页面级组件 |
| `composables` | 可复用组合式逻辑 |
| `stores` | Pinia 状态 |
| `router` | 路由配置 |

## 应用入口

```javascript
// main.js：创建应用并挂载到页面。
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

## script setup

`<script setup>` 是 Vue 3 单文件组件的推荐写法，模板可以直接访问脚本中的变量和函数。

```vue
<script setup>
import { ref } from 'vue'

// ref 用来声明响应式基础值。
const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">点击 {{ count }} 次</button>
</template>
```

## computed 与 watch

```vue
<script setup>
import { computed, ref, watch } from 'vue'

const firstName = ref('Ada')
const lastName = ref('Lovelace')

// computed 适合从已有状态派生新值。
const fullName = computed(() => `${firstName.value} ${lastName.value}`)

watch(fullName, value => {
  console.log('姓名变化：', value)
})
</script>

<template>
  <p>{{ fullName }}</p>
</template>
```

## 组合式函数

当逻辑需要复用时，把它提取到 `composables`。

```javascript
// composables/useToggle.js
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const value = ref(initialValue)

  function toggle() {
    value.value = !value.value
  }

  return { value, toggle }
}
```

```vue
<script setup>
import { useToggle } from '@/composables/useToggle'

const { value: isOpen, toggle } = useToggle()
</script>

<template>
  <button @click="toggle">{{ isOpen ? '关闭' : '打开' }}</button>
</template>
```

## 小结

Vue 3 的核心组合是 `create-vue`、Vite、单文件组件、`<script setup>` 和 Composition API。相比早期版本，Vue 3 更强调函数化逻辑复用和更轻的工程启动体验。
