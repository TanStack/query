---
id: useQueryClient
title: useQueryClient
---

The `useQueryClient` hook returns the current `QueryClient` instance.

```tsx
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient(id?: string)
```

**Options**

- `id?: string`
  - Use this if you have set up multiple `VueQueryPlugin` instances with different `queryClientKey`s, to select which injected `QueryClient` to use. Otherwise, the one from the nearest context will be used.

**Returns**

- `QueryClient`
  - The injected `QueryClient` instance. Throws if none is found in context.
