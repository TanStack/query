---
id: useInfiniteQuery
title: useInfiniteQuery
---

```js

const queryFn = (...queryKey, pageParam) // => Promise

const {
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  ...result
} = useInfiniteQuery(queryKey, queryFn, {
  ...options,
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor
})
```

**Options**

The options for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery) with the addition of the following:

- `getNextPageParam: (lastPage, allPages) => unknown | undefined`
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` to indicate there is no next page available.
- `getPreviousPageParam: (firstPage, allPages) => unknown | undefined`
  - When new data is received for this query, this function receives both the first page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function.
  - Return `undefined` to indicate there is no previous page available.

**Returns**

The returned properties for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery), with the addition of the following:

- `isFetchingNextPage: boolean`
  - Will be `true` while fetching the next page with `fetchNextPage`.
- `isFetchingPreviousPage: boolean`
  - Will be `true` while fetching the previous page with `fetchPreviousPage`.
- `fetchNextPage: (options?: FetchNextPageOptions) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the next "page" of results.
  - `options.pageParam: unknown` allows you to manually specify a page param instead of using `getNextPageParam`.
- `fetchPreviousPage: (options?: FetchPreviousPageOptions) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the previous "page" of results.
  - `options.pageParam: unknown` allows you to manually specify a page param instead of using `getPreviousPageParam`.
- `hasNextPage: boolean`
  - This will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option).
- `hasPreviousPage: boolean`
  - This will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option).
