---
id: useQueries
title: useQueries
---

The `useQueries` hook can be used to fetch a variable number of queries:

```tsx
const results = useQueries({
  queries: [
    { queryKey: ['post', 1], queryFn: fetchPost, staleTime: Infinity},
    { queryKey: ['post', 2], queryFn: fetchPost, staleTime: Infinity}
  ]
})
```

**Options**

The `useQueries` hook accepts an options object with a **queries** key whose value is an array with query option objects identical to the [`useQuery` hook](/reference/useQuery) (excluding the `context` option).

- `context?: React.Context<QueryClient | undefined>`
  - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.

**Returns**

The `useQueries` hook returns an array with all the query results.
