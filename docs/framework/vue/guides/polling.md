---
id: polling
title: Polling
ref: docs/framework/react/guides/polling.md
replace: { '@tanstack/react-query': '@tanstack/vue-query' }
---

[//]: # 'Example4'

```ts
import { VueQueryPlugin } from '@tanstack/vue-query'
import type { VueQueryPluginOptions } from '@tanstack/vue-query'

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchInterval: 60_000,
      },
    },
  },
}
app.use(VueQueryPlugin, vueQueryPluginOptions)
```

[//]: # 'Example4'
