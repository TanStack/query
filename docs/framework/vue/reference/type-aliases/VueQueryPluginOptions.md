---
id: VueQueryPluginOptions
title: VueQueryPluginOptions
---

```ts
type VueQueryPluginOptions = ConfigOptions | ClientOptions;
```

Defined in: [packages/vue-query/src/vueQueryPlugin.ts:42](https://github.com/TanStack/query/blob/main/packages/vue-query/src/vueQueryPlugin.ts#L42)

The options accepted by `VueQueryPlugin`: either a `queryClient` to install, or a `queryClientConfig` for the
client the plugin creates, plus the shared options.
