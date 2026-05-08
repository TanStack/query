---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

```tsx
infiniteQueryOptions({
  queryKey,
  ...options,
})
```

**Options**

You can generally pass everything to `infiniteQueryOptions` that you can also pass to [`useInfiniteQuery`](./useInfiniteQuery.md). These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.

- `queryKey: QueryKey`
  - **Required**
  - The query key to generate options for.

See [useInfiniteQuery](./useInfiniteQuery.md) for more information.
