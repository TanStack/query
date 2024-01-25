---
id: prefetching
title: Prefetching
---

If you're lucky enough, you may know enough about what your users will do to be able to prefetch the data they need before it's needed! If this is the case, you can use the `prefetchQuery` method to prefetch the results of a query to be placed into the cache:

```js
const prefetchTodos = async () => {
  // The results of this query will be cached like a normal query
  await queryClient.prefetchQuery('todos', fetchTodos)
}
```

- If data for this query is already in the cache and **not invalidated**, the data will not be fetched
- If a `staleTime` is passed eg. `prefetchQuery('todos', fn, { staleTime: 5000 })` and the data is older than the specified staleTime, the query will be fetched
- If no instances of `useQuery` appear for a prefetched query, it will be deleted and garbage collected after the time specified in `cacheTime`.

## Manually Priming a Query

Alternatively, if you already have the data for your query synchronously available, you don't need to prefetch it. You can just use the [Query Client's `setQueryData` method](../reference/QueryClient#queryclientsetquerydata) to directly add or update a query's cached result by key.

```js
queryClient.setQueryData('todos', todos)
```
