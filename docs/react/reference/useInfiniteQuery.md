---
id: useInfiniteQuery
title: useInfiniteQuery
---

```tsx
const {
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  ...result
} = useInfiniteQuery({
  queryKey,
  queryFn: ({ pageParam = 1 }) => fetchPage(pageParam),
  ...options,
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
})
```

**Options**

The options for `useInfiniteQuery` are identical to the [`useQuery` hook](../reference/useQuery) with the addition of the following:

- `queryFn: (context: QueryFunctionContext) => Promise<TData>`
  - **Required, but only if no default query function has been defined** [`defaultQueryFn`](../guides/default-query-function)
  - The function that the query will use to request data.
  - Receives a [QueryFunctionContext](../guides/query-functions#queryfunctioncontext)
  - Must return a promise that will either resolve data or throw an error.
  - Make sure you return the data *and* the `pageParam` if needed for use in the props below.
- `getNextPageParam: (lastPage, allPages) => unknown | undefined`
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` to indicate there is no next page available.
- `getPreviousPageParam: (firstPage, allPages) => unknown | undefined`
  - When new data is received for this query, this function receives both the first page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` to indicate there is no previous page available.

**Returns**

The returned properties for `useInfiniteQuery` are identical to the [`useQuery` hook](../reference/useQuery), with the addition of the following and a small difference in `isRefetching`:

- `data.pages: TData[]`
  - Array containing all pages.
- `data.pageParams: unknown[]`
  - Array containing all page params.
- `isFetchingNextPage: boolean`
  - Will be `true` while fetching the next page with `fetchNextPage`.
- `isFetchingPreviousPage: boolean`
  - Will be `true` while fetching the previous page with `fetchPreviousPage`.
- `fetchNextPage: (options?: FetchNextPageOptions) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the next "page" of results.
  - `options.pageParam: unknown` allows you to manually specify a page param instead of using `getNextPageParam`.
  - `options.cancelRefetch: boolean` if set to `true`, calling `fetchNextPage` repeatedly will invoke `fetchPage` every time, whether the previous
  invocation has resolved or not. Also, the result from previous invocations will be ignored. If set to `false`, calling `fetchNextPage`
  repeatedly won't have any effect until the first invocation has resolved. Default is `true`.
- `fetchPreviousPage: (options?: FetchPreviousPageOptions) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the previous "page" of results.
  - `options.pageParam: unknown` allows you to manually specify a page param instead of using `getPreviousPageParam`.
  - `options.cancelRefetch: boolean` same as for `fetchNextPage`.
- `hasNextPage: boolean`
  - This will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option).
- `hasPreviousPage: boolean`
  - This will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option).
- `isRefetching: boolean`
  - Is `true` whenever a background refetch is in-flight, which _does not_ include initial `loading` or fetching of next or previous page
  - Is the same as `isFetching && !isLoading && !isFetchingNextPage && !isFetchingPreviousPage`