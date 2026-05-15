---
title: 'Vue 3 初识与指令'
series: Vue
author: Joekma
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-05-15T00:00:00.000+08:00
slug: vue3-introduction-and-directives
featured: false
draft: false
tags:
  - Vue3
  - 前端框架
  - Composition API
  - 指令
description: '从 Vue 3 的 createApp、响应式状态和常用模板指令入门，掌握现代 Vue 单文件组件写法。'
---

> Vue 3 是一个渐进式 JavaScript 框架，适合从简单交互逐步扩展到完整的单页应用。它的核心体验围绕 `createApp`、单文件组件和 Composition API 展开。

## Vue 3 的核心特点

| 特性 | 说明 |
|------|------|
| 渐进式使用 | 可以从一个页面片段开始，也可以构建完整应用 |
| 响应式系统 | 使用 `ref`、`reactive`、`computed`、`watch` 管理状态 |
| 组件化 | 通过单文件组件拆分界面和逻辑 |
| Composition API | 按业务能力组织逻辑，便于复用和维护 |
| TypeScript 友好 | 对类型推断、组件参数和组合式函数支持更完整 |

## 快速开始

### CDN 方式

适合演示、原型和给旧页面补充少量交互：

```html
<div id="app">
  <p>{{ message }}</p>
  <button @click="count++">点击 {{ count }} 次</button>
</div>

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
  const { createApp, ref } = Vue

  createApp({
    setup() {
      const message = ref('你好，Vue 3')
      const count = ref(0)

      return {
        message,
        count,
      }
    },
  }).mount('#app')
</script>
```

### 单文件组件方式

新项目推荐使用 Vite 和单文件组件，模板、逻辑和样式可以聚合在一个 `.vue` 文件中：

```vue
<script setup>
import { ref } from 'vue'

const message = ref('你好，Vue 3')
const count = ref(0)
</script>

<template>
  <section class="demo">
    <p>{{ message }}</p>
    <button @click="count++">点击 {{ count }} 次</button>
  </section>
</template>

<style scoped>
.demo {
  display: grid;
  gap: 12px;
}
</style>
```

## 响应式状态

### ref

`ref` 适合字符串、数字、布尔值，也可以包裹对象。模板中会自动解包，脚本中需要通过 `.value` 读取或修改。

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value += 1
}
</script>

<template>
  <button @click="increment">当前次数：{{ count }}</button>
</template>
```

### reactive

`reactive` 适合结构稳定的对象状态。

```vue
<script setup>
import { reactive } from 'vue'

const form = reactive({
  username: '',
  email: '',
})
</script>

<template>
  <label>
    用户名
    <input v-model.trim="form.username" />
  </label>
  <label>
    邮箱
    <input v-model.trim="form.email" />
  </label>
</template>
```

### computed 与 watch

`computed` 用来声明派生值，`watch` 用来处理状态变化带来的副作用。

```vue
<script setup>
import { computed, ref, watch } from 'vue'

const keyword = ref('')
const items = ref(['Vue', 'Vite', 'Pinia', 'Router'])

const filteredItems = computed(() =>
  items.value.filter(item =>
    item.toLowerCase().includes(keyword.value.toLowerCase())
  )
)

watch(keyword, value => {
  console.log('搜索关键词变为：', value)
})
</script>

<template>
  <input v-model.trim="keyword" placeholder="搜索技术栈" />
  <ul>
    <li v-for="item in filteredItems" :key="item">{{ item }}</li>
  </ul>
</template>
```

## 常用指令

### 文本渲染

```vue
<script setup>
const title = 'Vue 3 指令'
const safeHtml = '<strong>只渲染可信 HTML</strong>'
</script>

<template>
  <h2 v-text="title"></h2>
  <p v-html="safeHtml"></p>
</template>
```

`v-html` 会把字符串作为 HTML 插入页面，只能用于可信内容，不能直接渲染用户输入。

### 条件渲染

```vue
<script setup>
import { ref } from 'vue'

const isLoggedIn = ref(false)
const isLoading = ref(false)
</script>

<template>
  <p v-if="isLoading">加载中...</p>
  <p v-else-if="isLoggedIn">欢迎回来</p>
  <p v-else>请先登录</p>

  <button v-show="!isLoading">可见性由 CSS 控制</button>
</template>
```

`v-if` 会创建或销毁节点，适合切换频率低的场景。`v-show` 只是切换 `display`，适合频繁显示隐藏。

### 列表渲染

```vue
<script setup>
const users = [
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Lin', role: 'editor' },
]
</script>

<template>
  <ul>
    <li v-for="user in users" :key="user.id">
      {{ user.name }} - {{ user.role }}
    </li>
  </ul>
</template>
```

列表必须提供稳定的 `key`，优先使用业务唯一 ID。

### 表单绑定

```vue
<script setup>
import { ref } from 'vue'

const username = ref('')
const agree = ref(false)
const level = ref('basic')
</script>

<template>
  <input v-model.trim="username" placeholder="用户名" />

  <label>
    <input v-model="agree" type="checkbox" />
    同意协议
  </label>

  <select v-model="level">
    <option value="basic">基础</option>
    <option value="pro">专业</option>
  </select>
</template>
```

常见修饰符包括 `trim`、`number` 和 `lazy`。

### 事件绑定

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)

function submit() {
  console.log('提交表单')
}
</script>

<template>
  <button @click="count++">增加</button>

  <form @submit.prevent="submit">
    <button type="submit">提交</button>
  </form>

  <input @keyup.enter="submit" placeholder="按 Enter 提交" />
</template>
```

`@click` 是 `v-on:click` 的缩写，`.prevent`、`.stop`、`.enter` 等修饰符能让模板更清晰。

### 属性绑定

```vue
<script setup>
import { computed, ref } from 'vue'

const isActive = ref(true)
const imageUrl = '/images/avatar.png'

const buttonClass = computed(() => ({
  active: isActive.value,
  muted: !isActive.value,
}))
</script>

<template>
  <img :src="imageUrl" alt="头像" />
  <button :class="buttonClass" :disabled="!isActive">保存</button>
</template>
```

`:` 是 `v-bind:` 的缩写，适合动态绑定属性、类名、样式和组件参数。

## 自定义指令

自定义指令适合封装直接操作 DOM 的小能力，例如自动聚焦：

```vue
<script setup>
const vFocus = {
  mounted(element) {
    element.focus()
  },
}
</script>

<template>
  <input v-focus placeholder="打开页面后自动聚焦" />
</template>
```

在 `<script setup>` 中，以 `v` 开头的对象可以直接作为局部自定义指令使用。

## 小结

- 使用 `createApp` 挂载 Vue 3 应用。
- 新项目优先采用 Vite、单文件组件和 `<script setup>`。
- 用 `ref`、`reactive`、`computed`、`watch` 管理状态和派生逻辑。
- 熟悉 `v-if`、`v-show`、`v-for`、`v-model`、`v-on`、`v-bind` 等指令后，就能完成大多数基础交互。
