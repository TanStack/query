---
id: VueQueryPlugin
title: VueQueryPlugin
---

```ts
const VueQueryPlugin: object;
```

Defined in: [packages/vue-query/src/vueQueryPlugin.ts:74](https://github.com/TanStack/query/blob/main/packages/vue-query/src/vueQueryPlugin.ts#L74)

Installs a `QueryClient` on the Vue app, making it available to every descendant component through
`useQueryClient` — the Vue equivalent of React's `QueryClientProvider`, but wired up as an app-level plugin
instead of a wrapping component.

## Type Declaration

### install()

```ts
install: (app, options) => void;
```

#### Parameters

##### app

`any`

##### options

[`VueQueryPluginOptions`](../type-aliases/VueQueryPluginOptions.md) = `{}`

#### Returns

`void`

## Examples

```ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App)
app.use(VueQueryPlugin)
```

Pass a `queryClient` you constructed yourself — useful for SSR, where you need a fresh `QueryClient` per
request, or when the same instance also needs to be used outside of Vue components:
```ts
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const queryClient = new QueryClient()
app.use(VueQueryPlugin, { queryClient })
```

Or pass `queryClientConfig` to let the plugin construct the `QueryClient` for you, with your own defaults:
```ts
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: { queries: { staleTime: 5 * 1000 } },
  },
})
```
