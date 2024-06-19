---
id: usePrefetchQuery
title: usePrefetchQuery
---

```tsx
const result = usePrefetchQuery(options)
```

**Options**

You can pass everything to `usePrefetchQuery` that you can pass to [`queryOptions`](../queryOptions) or [`useQuery`](../useQuery). Some options will have no effect because, under the hood, `usePrefetchQuery` uses `queryClient.prefetchQuery`. Since the options are general, TypeScript will not warn you about any excess properties.

- `queryKey: QueryKey`

  - **Required**
  - The query key to prefetch during render

- `queryFn: (context: QueryFunctionContext) => Promise<TData>`
  - **Required, but only if no default query function has been defined** See [Default Query Function](../../guides/default-query-function) for more information.

**Returns**

The `usePrefetchQuery` does not return nothing, it should be used just to fire a prefetch during render, before any suspense boundaries.
