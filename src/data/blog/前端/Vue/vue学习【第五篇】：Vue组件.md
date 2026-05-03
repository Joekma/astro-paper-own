---
title: Vue组件系统
author: 程序员
pubDatetime: 2024-08-13T00:00:00.000+08:00
modDatetime: 2026-04-22T00:00:00.000+08:00
slug: vue-components
featured: false
draft: false
tags:
  - Vue
  - 组件
  - 前端
  - JavaScript
description: 'Vue组件详解，包含注册、props、emit、slot和状态管理'
---

> 组件是 Vue.js 最强大的功能之一，用于封装可复用的代码。

## 组件注册

### 全局注册

```javascript
Vue.component('my-button', {
    template: '<button @click="handleClick">{{ text }}</button>',
    data() {
        return { text: '按钮' }
    },
    methods: {
        handleClick() {
            this.$emit('click')
        }
    }
})
```

### 局部注册

```javascript
import MyButton from './MyButton.vue'

export default {
    components: {
        MyButton
    }
}
```

## Props

### 父组件向子组件传值

```javascript
// 子组件
export default {
    props: {
        title: String,
        count: {
            type: Number,
            required: true,
            default: 0
        }
    }
}
```

```html
<!-- 父组件 -->
<child-component 
    title="标题" 
    :count="num"
/>
```

### Props 验证

```javascript
props: {
    // 基础类型
    propA: Number,
    
    // 多个类型
    propB: [String, Number],
    
    // 必填
    propC: {
        type: String,
        required: true
    },
    
    // 默认值
    propD: {
        type: Object,
        default() {
            return { message: 'hello' }
        }
    },
    
    // 自定义验证
    propE: {
        validator(value) {
            return ['success', 'warning', 'danger'].includes(value)
        }
    }
}
```

## Emit

### 子组件向父组件传值

```javascript
// 子组件
export default {
    methods: {
        handleClick() {
            this.$emit('update', this.value)
            this.$emit('custom-event', { id: 1 })
        }
    }
}
```

```html
<!-- 父组件 -->
<child-component 
    @update="handleUpdate"
    @custom-event="handleCustom"
/>
```

```javascript
methods: {
    handleUpdate(value) {
        console.log('更新:', value)
    }
}
```

## Slot

### 插槽基础

```html
<!-- 子组件 -->
<div class="card">
    <slot></slot>
</div>

<!-- 父组件 -->
<card>
    <h1>卡片标题</h1>
    <p>卡片内容</p>
</card>
```

### 具名插槽

```html
<!-- 子组件 -->
<div class="layout">
    <header><slot name="header"></slot></header>
    <main><slot></slot></main>
    <footer><slot name="footer"></slot></footer>
</div>

<!-- 父组件 -->
<layout>
    <template #header>
        <h1>标题</h1>
    </template>
    <p>主要内容</p>
    <template #footer>
        <p>底部</p>
    </template>
</layout>
```

### 作用域插槽

```html
<!-- 子组件 -->
<ul>
    <li v-for="item in items" :key="item.id">
        <slot :item="item">{{ item.name }}</slot>
    </li>
</ul>

<!-- 父组件 -->
<my-list :items="list">
    <template #default="{ item }">
        <span :style="{ color: item.color }">{{ item.name }}</span>
    </template>
</my-list>
```

## 组件通信

### provide/inject

```javascript
// 祖先组件
export default {
    provide: {
        theme: 'dark'
    }
}

// 后代组件
export default {
    inject: ['theme']
}
```

### Event Bus

```javascript
// event-bus.js
import Vue from 'vue'
export const bus = new Vue()

// 组件 A
import { bus } from './event-bus'
bus.$emit('message', 'hello')

// 组件 B
import { bus } from './event-bus'
bus.$on('message', msg => console.log(msg))
```

## 生命周期

| 钩子 | 说明 |
|------|------|
| `beforeCreate` | 实例初始化 |
| `created` | 实例创建完成 |
| `beforeMount` | 挂载前 |
| `mounted` | 挂载完成 |
| `beforeUpdate` | 更新前 |
| `updated` | 更新完成 |
| `beforeDestroy` | 销毁前 |
| `destroyed` | 销毁完成 |

## 组件状态管理

### Vuex

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        count: 0
    },
    mutations: {
        increment(state) {
            state.count++
        }
    },
    actions: {
        asyncIncrement({ commit }) {
            setTimeout(() => {
                commit('increment')
            }, 1000)
        }
    },
    getters: {
        doubleCount: state => state.count * 2
    }
})
```

```javascript
// 组件中使用
export default {
    computed: {
        count() {
            return this.$store.state.count
        }
    },
    methods: {
        increment() {
            this.$store.commit('increment')
        }
    }
}
```

### Pinia（推荐）

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
    state: () => ({ count: 0 }),
    getters: {
        doubleCount: (state) => state.count * 2
    },
    actions: {
        increment() {
            this.count++
        }
    }
})
```

```javascript
// 组件中使用
import { useCounterStore } from '@/stores/counter'

export default {
    setup() {
        const counter = useCounterStore()
        return { counter }
    }
}
```

## 小结

- **注册**：全局注册和局部注册
- **Props**：父组件向子组件传值，支持验证
- **Emit**：子组件向父组件传值
- **Slot**：内容分发，具名插槽和作用域插槽
- **通信**：props/emit、provide/inject、Event Bus
- **状态**：Vuex 和 Pinia
