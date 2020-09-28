---
id: useInfiniteQuery
title: useInfiniteQuery
---

```js

const queryFn = (...queryKey, fetchMoreVariable) // => Promise

const {
  isFetchingMore,
  fetchMore,
  canFetchMore,
  ...result
} = useInfiniteQuery(queryKey, queryFn, {
  ...options,
  getFetchMore: (lastPage, allPages) => fetchMoreVariable
})
```

**Options**

The options for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery) with the addition of the following:

- `getFetchMore: (lastPage, allPages) => fetchMoreVariable | boolean`
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function

**Returns**

The returned properties for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery), with the addition of the following:

- `isFetchingMore: false | 'next' | 'previous'`
  - If using `paginated` mode, this will be `true` when fetching more results using the `fetchMore` function.
- `fetchMore: (fetchMoreVariableOverride) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the next "page" of results.
  - `fetchMoreVariableOverride` allows you to optionally override the fetch more variable returned from your `getFetchMore` option to your query function to retrieve the next page of results.
- `canFetchMore: boolean`
  - If using `paginated` mode, this will be `true` if there is more data to be fetched (known via the required `getFetchMore` option function).
