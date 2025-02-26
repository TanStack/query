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
  promise,
  ...result
} = useInfiniteQuery({
  queryKey,
  queryFn: ({ pageParam }) => fetchPage(pageParam),
  initialPageParam: 1,
  ...options,
  getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
    lastPage.nextCursor,
  getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) =>
    firstPage.prevCursor,
})
```

**Options**

The options for `useInfiniteQuery` are identical to the [`useQuery` hook](./useQuery) with the addition of the following:

- `queryFn: (context: QueryFunctionContext) => Promise<TData>`
  - **Required, but only if no default query function has been defined** [`defaultQueryFn`](../guides/default-query-function)
  - The function that the query will use to request data.
  - Receives a [QueryFunctionContext](../guides/query-functions#queryfunctioncontext)
  - Must return a promise that will either resolve data or throw an error.
- `initialPageParam: TPageParam`
  - **Required**
  - The default page param to use when fetching the first page.
- `getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => TPageParam | undefined | null`
  - **Required**
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages, as well as pageParam information.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` or `null` to indicate there is no next page available.
- `getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => TPageParam | undefined | null`
  - When new data is received for this query, this function receives both the first page of the infinite list of data and the full array of all pages, as well as pageParam information.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` or `null`to indicate there is no previous page available.
- `maxPages: number | undefined`
  - The maximum number of pages to store in the infinite query data.
  - When the maximum number of pages is reached, fetching a new page will result in the removal of either the first or last page from the pages array, depending on the specified direction.
  - If `undefined` or equals `0`, the number of pages is unlimited
  - Default value is `undefined`
  - `getNextPageParam` and `getPreviousPageParam` must be properly defined if `maxPages` value is greater than `0` to allow fetching a page in both directions when needed.

**Returns**

The returned properties for `useInfiniteQuery` are identical to the [`useQuery` hook](./useQuery), with the addition of the following properties and a small difference in `isRefetching` and `isRefetchError`:

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
  - `options.cancelRefetch: boolean` if set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time, whether the previous
    invocation has resolved or not. Also, the result from previous invocations will be ignored. If set to `false`, calling `fetchNextPage`
    repeatedly won't have any effect until the first invocation has resolved. Default is `true`.
- `fetchPreviousPage: (options?: FetchPreviousPageOptions) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the previous "page" of results.
  - `options.cancelRefetch: boolean` same as for `fetchNextPage`.
- `hasNextPage: boolean`
  - Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option).
- `hasPreviousPage: boolean`
  - Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option).
- `isFetchNextPageError: boolean`
  - Will be `true` if the query failed while fetching the next page.
- `isFetchPreviousPageError: boolean`
  - Will be `true` if the query failed while fetching the previous page.
- `isRefetching: boolean`
  - Will be `true` whenever a background refetch is in-flight, which _does not_ include initial `pending` or fetching of next or previous page
  - Is the same as `isFetching && !isPending && !isFetchingNextPage && !isFetchingPreviousPage`
- `isRefetchError: boolean`
  - Will be `true` if the query failed while refetching a page.
- `promise: Promise<TData>`
  - A stable promise that resolves to the query result.
  - This can be used with `React.use()` to fetch data
  - Requires the `experimental_prefetchInRender` feature flag to be enabled on the `QueryClient`.

Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default refetch behaviour, resulting in outdated data. Make sure to call these functions only in response to user actions, or add conditions like `hasNextPage && !isFetching`.
