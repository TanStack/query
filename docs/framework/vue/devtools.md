---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because Vue Query comes with dedicated devtools! 🥳

When you begin your Vue Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of Vue Query and will likely save you hours of debugging if you find yourself in a pinch!

## Component based Devtools (Vue 3)

You can directly integrate the devtools component into your page using a dedicated package.
Component-based devtools use a framework-agnostic implementation and are always up-to-date.

The devtools component is a separate package that you need to install:

```bash
npm i @tanstack/vue-query-devtools
```

or

```bash
pnpm add @tanstack/vue-query-devtools
```

or

```bash
yarn add @tanstack/vue-query-devtools
```

or

```bash
bun add @tanstack/vue-query-devtools
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
  - Set this `true` if you want the dev tools to default to being open.
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"`
  - Defaults to `bottom-right`.
  - The position of the React Query logo to open and close the devtools panel.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`.
  - The position of the React Query devtools panel.
- `client?: QueryClient`
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}`
  - Use this to predefine some errors that can be triggered on your queries. The initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.

## Traditional Devtools

Vue Query will seamlessly integrate with the [Official Vue devtools](https://github.com/vuejs/devtools-next), adding custom inspector and timeline events.
Devtool code will be treeshaken from production bundles by default.

To make it work, you only need to enable it in the plugin options:

```ts
app.use(VueQueryPlugin, {
  enableDevtoolsV6Plugin: true,
})
```

Both v6 and v7 versions of devtools are supported.
