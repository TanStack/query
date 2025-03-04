---
id: useQueries
title: useQueries
---

The `useQueries` hook can be used to fetch a variable number of queries:

```tsx
const ids = [1, 2, 3]
const results = useQueries({
  queries: ids.map((id) => ({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    staleTime: Infinity,
  })),
})
```

**Options**

The `useQueries` hook accepts an options object with a **queries** key whose value is an array with query option objects identical to the [`useQuery` hook](./useQuery) (excluding the `queryClient` option - because the `QueryClient` can be passed in on the top level).

- `queryClient?: QueryClient`
  - Use this to provide a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `combine?: (result: UseQueriesResults) => TCombinedResult`
  - Use this to combine the results of the queries into a single value.

> Having the same query key more than once in the array of query objects may cause some data to be shared between queries. To avoid this, consider de-duplicating the queries and map the results back to the desired structure.

**placeholderData**

The `placeholderData` option exists for `useQueries` as well, but it doesn't get information passed from previously rendered Queries like `useQuery` does, because the input to `useQueries` can be a different number of Queries on each render.

**Returns**

The `useQueries` hook returns an array with all the query results. The order returned is the same as the input order.

## Combine

If you want to combine `data` (or other Query information) from the results into a single value, you can use the `combine` option. The result will be structurally shared to be as referentially stable as possible.

```tsx
const ids = [1, 2, 3]
const combinedQueries = useQueries({
  queries: ids.map((id) => ({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })),
  combine: (results) => {
    return {
      data: results.map((result) => result.data),
      pending: results.some((result) => result.isPending),
    }
  },
})
```

In the above example, `combinedQueries` will be an object with a `data` and a `pending` property. Note that all other properties of the Query results will be lost.

### Memoization

The `combine` function will only re-run if:

- the `combine` function itself changed referentially
- any of the query results changed

This means that an inlined `combine` function, as shown above, will run on every render. To avoid this, you can wrap the `combine` function in `useCallback`, or extract it to a stable function reference if it doesn't have any dependencies.
