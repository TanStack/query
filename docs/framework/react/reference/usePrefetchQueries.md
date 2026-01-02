---
id: usePrefetchQueries
title: usePrefetchQueries
---

```tsx
const ids = [1, 2, 3]

const queryOpts = ids.map((id) => ({
  queryKey: ['post', id],
  queryFn: () => fetchPost(id),
  staleTime: Infinity,
}))

// parent component
usePrefetchQueries({
  queries: queryOps,
})

// child component with suspense
const results = useSuspenseQueries({
  queries: queryOpts,
})
```

**Options**

The `useQueries` hook accepts an options object with a **queries** key whose value is an array with query option objects identical to the [`usePrefetchQuery` hook](../reference/usePrefetchQuery). Remember that some of them are required as below:

- `queryKey: QueryKey`

  - **Required**
  - The query key to prefetch during render

- `queryFn: (context: QueryFunctionContext) => Promise<TData>`
  - **Required, but only if no default query function has been defined** See [Default Query Function](../guides/default-query-function) for more information.

**Returns**

The `usePrefetchQuery` does not return anything, it should be used just to fire a prefetch during render, before a suspense boundary that wraps a component that uses [`useSuspenseQuery`](../reference/useSuspenseQueries).
