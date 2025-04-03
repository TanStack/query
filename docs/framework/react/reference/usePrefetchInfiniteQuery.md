---
id: usePrefetchInfiniteQuery
title: usePrefetchInfiniteQuery
---

```tsx
usePrefetchInfiniteQuery(options)
```

**Options**

You can pass everything to `usePrefetchInfiniteQuery` that you can pass to [`queryClient.prefetchInfiniteQuery`](../../../reference/QueryClient.md#queryclientprefetchinfinitequery). Remember that some of them are required as below:

- `queryKey: QueryKey`

  - **Required**
  - The query key to prefetch during render

- `queryFn: (context: QueryFunctionContext) => Promise<TData>`

  - **Required, but only if no default query function has been defined** See [Default Query Function](../guides/default-query-function.md) for more information.

- `initialPageParam: TPageParam`

  - **Required**
  - The default page param to use when fetching the first page.

- `getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => TPageParam | undefined | null`

  - **Required**
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages, as well as pageParam information.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` or `null` to indicate there is no next page available.

- **Returns**

The `usePrefetchInfiniteQuery` does not return anything, it should be used just to fire a prefetch during render, before a suspense boundary that wraps a component that uses [`useSuspenseInfiniteQuery`](../reference/useSuspenseInfiniteQuery.md)
