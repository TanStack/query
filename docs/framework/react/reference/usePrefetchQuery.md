---
id: usePrefetchQuery
title: usePrefetchQuery
---

```tsx
usePrefetchQuery(options)
```

**Options**

You can pass everything to `usePrefetchQuery` that you can pass to [`queryClient.prefetchQuery`](../../../../reference/QueryClient#queryclientprefetchquery). Remember that some of them are required as below:

- `queryKey: QueryKey`

  - **Required**
  - The query key to prefetch during render

- `queryFn: (context: QueryFunctionContext) => Promise<TData>`
  - **Required, but only if no default query function has been defined** See [Default Query Function](../../guides/default-query-function) for more information.

**Returns**

The `usePrefetchQuery` does not return anything, it should be used just to fire a prefetch during render, before a suspense boundary that wraps a component that uses [`useSuspenseQuery`](../useSuspenseQuery).
