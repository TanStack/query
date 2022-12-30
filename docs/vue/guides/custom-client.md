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
    defaultOptions: { queries: { staleTime: 3600 } },
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

You can also customize the key under which `QueryClient` will be accessible in Vue context. This can be usefull is you want to avoid name clashing between multiple apps on the same page with Vue2.

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

To use the custom client key, You have to provide it as a query options

```js
useQuery({
  queryKey: ['query1'],
  queryFn: fetcher,
  queryClientKey: 'foo',
})
```

Internally custom key will be combined with default query key as a suffix. But user do not have to worry about it.

```tsx
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientKey: 'Foo',
}
app.use(VueQueryPlugin, vueQueryPluginOptions) // -> VUE_QUERY_CLIENT:Foo
```
