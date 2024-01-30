---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because Vue Query comes with dedicated devtools! 🥳

When you begin your Vue Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of Vue Query and will likely save you hours of debugging if you find yourself in a pinch!

The only thing you need to do is to install the official **[Vue Devtools](https://devtools.vuejs.org/guide/installation.html)**.

Vue Query will seamlessly integrate with the official devtools, adding custom inspector and timeline events.
Devtool code will be treeshaken from production bundles by default.

## Component based Devtools (Vue 3)

You can embeed devtools component into your page by using dedicated package.  
Component based devtools are using the same framework-agnostic implementation, have more features and are updated more frequently.

The devtools component is a separate package that you need to install:

```bash
$ npm i @tanstack/vue-query-devtools
# or
$ pnpm add @tanstack/vue-query-devtools
# or
$ yarn add @tanstack/vue-query-devtools
```

By default, Vue Query Devtools are only included in bundles when `process.env.NODE_ENV === 'development'`, so you don't need to worry about excluding them during a production build.

Devtools will be mounted as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Vue app as you can. The closer it is to the root of the page, the better it will work!

```vue
<script setup>
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <h1>The app!</h1>
  <VueQueryDevtools />
</template>
```

### Options

- `initialIsOpen: Boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"`
  - Defaults to `bottom-right`
  - The position of the React Query logo to open and close the devtools panel
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the React Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
