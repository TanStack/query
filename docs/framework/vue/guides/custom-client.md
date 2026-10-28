---
id: custom-client
title: Custom Client
---

### Custom client

Vue Query allows providing custom `QueryClient` for Vue context.

It might be handy when you need to create `QueryClient` beforehand to integrate it with other libraries that do not have access to the Vue context.

For this reason, `VueQueryPlugin` accepts either `QueryClientConfig` or `QueryClient` as a plugin options.

If You provide `QueryClientConfig`, `QueryClient` instance will be created internally and provided to Vue context.

```tsx
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: { queries: { staleTime: 60 * 60 * 1000 } },
  },
}
app.use(VueQueryPlugin, vueQueryPluginOptions)
```

```tsx
const myClient = new QueryClient(queryClientConfig)
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient: myClient,
}
app.use(VueQueryPlugin, vueQueryPluginOptions)
```

### Custom context key

You can also customize the key under which `QueryClient` will be accessible in Vue context. This can be useful is you want to avoid name clashing between multiple apps on the same page with Vue2.

It works both with default, and custom `QueryClient`

```tsx
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientKey: 'Foo',
}
app.use(VueQueryPlugin, vueQueryPluginOptions)
```

```tsx
const myClient = new QueryClient(queryClientConfig)
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient: myClient,
  queryClientKey: 'Foo',
}
app.use(VueQueryPlugin, vueQueryPluginOptions)
```

To use the client registered under a custom key, get it with `useQueryClient` and pass it as the second argument

```js
useQuery(
  {
    queryKey: ['query1'],
    queryFn: fetcher,
  },
  useQueryClient('Foo'),
)
```

The devtools look up the client under the default key, so pass the client to them through the `client` prop as well

```vue
<script setup>
import { useQueryClient } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const queryClient = useQueryClient('Foo')
</script>

<template>
  <VueQueryDevtools :client="queryClient" />
</template>
```

Internally custom key will be combined with default query key as a suffix. But user do not have to worry about it.

```tsx
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientKey: 'Foo',
}
app.use(VueQueryPlugin, vueQueryPluginOptions) // -> VUE_QUERY_CLIENT:Foo
```
