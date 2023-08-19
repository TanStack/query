---
id: prefetching
title: Prefetching
---

If you're lucky enough, you may know enough about what your users will do to be able to prefetch the data they need before it's needed! If this is the case, you can use the `prefetchQuery` method to prefetch the results of a query to be placed into the cache:

[//]: # 'ExamplePrefetching'

```tsx
const prefetchTodos = async () => {
  // The results of this query will be cached like a normal query
  await queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })
}
```

[//]: # 'ExamplePrefetching'

- If **fresh** data for this query is already in the cache, the data will not be fetched
- If a `staleTime` is passed eg. `prefetchQuery({ queryKey: ['todos'], queryFn: fn, staleTime: 5000 })` and the data is older than the specified `staleTime`, the query will be fetched
- If no instances of `useQuery` appear for a prefetched query, it will be deleted and garbage collected after the time specified in `gcTime`.

## Prefetching Infinite Queries

Infinite Queries can be prefetched like regular Queries. Per default, only the first page of the Query will be prefetched and will be stored under the given QueryKey. If you want to prefetch more than one page, you can use the `pages` option, in which case you also have to provide a `getNextPageParam` function:

[//]: # 'ExampleInfiniteQuery'
```tsx
const prefetchTodos = async () => {
  // The results of this query will be cached like a normal query
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    pages: 3 // prefetch the first 3 pages
  })
}
```
[//]: # 'ExampleInfiniteQuery'

The above code will try to prefetch 3 pages in order, and `getNextPageParam` will be executed for each page to determine the next page to prefetch. If `getNextPageParam` returns `undefined`, the prefetching will stop.

## Manually Priming a Query

Alternatively, if you already have the data for your query synchronously available, you don't need to prefetch it. You can just use the [Query Client's `setQueryData` method](../reference/QueryClient#queryclientsetquerydata) to directly add or update a query's cached result by key.

[//]: # 'ExampleSetQueryData'

```tsx
queryClient.setQueryData(['todos'], todos)
```

[//]: # 'ExampleSetQueryData'

[//]: # 'Materials'

## Further reading

For a deep-dive on how to get data into your Query Cache before you fetch, have a look at [#17: Seeding the Query Cache](../community/tkdodos-blog#17-seeding-the-query-cache) from the Community Resources.

[//]: # 'Materials'
