---
id: window-focus-refetching
title: Window Focus Refetching
ref: docs/react/guides/window-focus-refetching.md
replace: { '@tanstack/react-query': '@tanstack/vue-query' }
---

[//]: # 'Example'

```js
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
}
app.use(VueQueryPlugin, vueQueryPluginOptions)
```

[//]: # 'Example'
[//]: # 'ReactNative'
[//]: # 'ReactNative'
