---
id: useQueries
title: useQueries
---

The `useQueries` hook can be used to fetch a variable number of queries:

```tsx
const results = useQueries({
  queries: [
    { queryKey: ['post', 1], queryFn: fetchPost, staleTime: Infinity },
    { queryKey: ['post', 2], queryFn: fetchPost, staleTime: Infinity },
  ],
})
```

**Options**

The `useQueries` hook accepts an options object with a **queries** key whose value is an array with query option objects identical to the [`useQuery` hook](../../../../framwork/react/reference/useQuery) (excluding the `context` option).

- `context?: React.Context<QueryClient | undefined>`
  - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.

> Having the same query key more than once in the array of query objects may cause some data to be shared between queries, e.g. when using `placeholderData` and `select`. To avoid this, consider de-duplicating the queries and map the results back to the desired structure.

**Returns**

The `useQueries` hook returns an array with all the query results. The order returned is the same as the input order.
