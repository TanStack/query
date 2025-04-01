---
id: streamedQuery
title: streamedQuery
---

`streamedQuery` is a helper function to create a query function that streams data from an [AsyncIterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator). Data will be an Array of all the chunks received. The query will be in a `pending` state until the first chunk of data is received, but will go to `success` after that. The query will stay in fetchStatus `fetching` until the stream ends.

```tsx
const query = queryOptions({
  queryKey: ['data'],
  queryFn: streamedQuery({
    queryFn: fetchDataInChunks,
  }),
})
```

**Options**

- `queryFn: (context: QueryFunctionContext) => Promise<AsyncIterable<TData>>`
  - **Required**
  - The function that returns a Promise of an AsyncIterable of data to stream in.
  - Receives a [QueryFunctionContext](../guides/query-functions.md#queryfunctioncontext)
- `refetchMode?: 'append' | 'reset'`
  - optional
  - when set to `'reset'`, the query will erase all data and go back into `pending` state when a refetch occurs.
  - when set to `'append'`, data will be appended on a refetch.
  - defaults to `'reset'`
