---
id: useIsMutating
title: useIsMutating
---

`useIsMutating` is an optional hook that returns the `number` of mutations that your application is currently in a `pending` state with (useful for app-wide loading indicators).

```tsx
import { useIsMutating } from '@tanstack/vue-query'
// How many mutations are pending?
const isMutating = useIsMutating()
// How many mutations matching the posts prefix are pending?
const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
```

**Options**

- `filters?: MutationFilters`: [Mutation Filters](../guides/filters.md#mutation-filters)
- `queryClient?: QueryClient`
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.

**Returns**

- `isMutating: Ref<number>`
  - Will resolve to the `number` of the mutations that your application is currently pending with.
