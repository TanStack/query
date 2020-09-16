---
id: prefetching
title: Prefetching
---

If you're lucky enough, you may know enough about what your users will do to be able to prefetch the data they need before it's needed! If this is the case, you can use the `fetchQuery` or `prefetchQuery` methods to prefetch the results of a query to be placed into the cache:

```js
const prefetchTodos = async () => {
  await queryCache.prefetchQuery('todos', () => fetch('/todos'))
  // The results of this query will be cached like a normal query
}
```

The next time a `useQuery` instance is used for a prefetched query, it will use the cached data! If no instances of `useQuery` appear for a prefetched query, it will be deleted and garbage collected after the time specified in `cacheTime`.

If a prefetched query is rendered after the `staleTime` for a prefetched query, it will still render, but will be automatically refetched in the background! Cool right?!

## Manually Priming a Query

Alternatively, if you already have the data for your query synchronously available, you don't need to prefetch it. You can just use the [Query Cache's `setQueryData` method](../api/#querycachesetquerydata) to directly add or update a query's cached result.

```js
queryCache.setQueryData('todos', todos)
```
