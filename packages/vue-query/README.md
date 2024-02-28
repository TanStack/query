[![Vue Query logo](https://raw.githubusercontent.com/TanStack/query/main/packages/vue-query/media/vue-query.png)](https://github.com/TanStack/query/tree/main/packages/vue-query)

[![npm version](https://img.shields.io/npm/v/@tanstack/vue-query)](https://www.npmjs.com/package/@tanstack/vue-query)
[![npm license](https://img.shields.io/npm/l/@tanstack/vue-query)](https://github.com/TanStack/query/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tanstack/vue-query)](https://bundlephobia.com/package/@tanstack/vue-query)
[![npm](https://img.shields.io/npm/dm/@tanstack/vue-query)](https://www.npmjs.com/package/@tanstack/vue-query)

# Vue Query

Hooks for fetching, caching and updating asynchronous data in Vue.

Support for Vue 2.x via [vue-demi](https://github.com/vueuse/vue-demi)

# Documentation

Visit https://tanstack.com/query/latest/docs/vue/overview

# Quick Features

- Transport/protocol/backend agnostic data fetching (REST, GraphQL, promises, whatever!)
- Auto Caching + Refetching (stale-while-revalidate, Window Refocus, Polling/Realtime)
- Parallel + Dependent Queries
- Mutations + Reactive Query Refetching
- Multi-layer Cache + Automatic Garbage Collection
- Paginated + Cursor-based Queries
- Load-More + Infinite Scroll Queries w/ Scroll Recovery
- Request Cancellation
- (experimental) [Suspense](https://v3.vuejs.org/guide/migration/suspense.html#introduction) + Fetch-As-You-Render Query Prefetching
- (experimental) SSR support
- Dedicated Devtools
- [![npm bundle size](https://img.shields.io/bundlephobia/minzip/@tanstack/vue-query)](https://bundlephobia.com/package/@tanstack/vue-query) (depending on features imported)

# Quick Start

1. Install `vue-query`

   ```bash
   $ npm i @tanstack/vue-query
   # or
   $ pnpm add @tanstack/vue-query
   # or
   $ yarn add @tanstack/vue-query
   # or
   $ bun add @tanstack/vue-query
   ```

   > If you are using Vue 2.6, make sure to also setup [@vue/composition-api](https://github.com/vuejs/composition-api)

2. Initialize **Vue Query** via **VueQueryPlugin**

   ```tsx
   import { createApp } from 'vue'
   import { VueQueryPlugin } from '@tanstack/vue-query'

   import App from './App.vue'

   createApp(App).use(VueQueryPlugin).mount('#app')
   ```

3. Use query

   ```tsx
   import { defineComponent } from 'vue'
   import { useQuery } from '@tanstack/vue-query'

   export default defineComponent({
     name: 'MyComponent',
     setup() {
       const query = useQuery({ queryKey: ['todos'], queryFn: getTodos })

       return {
         query,
       }
     },
   })
   ```

4. If you need to update options on your query dynamically, make sure to pass them as reactive variables

   ```tsx
   const id = ref(1)
   const enabled = ref(false)

   const query = useQuery({
     queryKey: ['todos', id],
     queryFn: () => getTodos(id),
     enabled,
   })
   ```
