---
id: streamedQuery
title: streamedQuery
---

`streamedQuery` is a helper function to create a query function that streams data from an [AsyncIterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator). Data will be an Array of all the chunks received. The query will be in a `pending` state until the first chunk of data is received, but will go to `success` after that. The query will stay in fetchStatus `fetching` until the stream ends.

To see `streamedQuery` in action, take a look at our [chat example](../framework/react/examples/chat/react/nextjs-app-prefetching).

```tsx
import { experimental_streamedQuery as streamedQuery } from '@tanstack/react-query'

const query = queryOptions({
  queryKey: ['data'],
  queryFn: streamedQuery({
    queryFn: fetchDataInChunks,
  }),
})
```

> Note: `streamedQuery` is currently marked as `experimental` because we want to gather feedback from the community. If you've tried out the API and have feedback for us, please provide it in this [GitHub discussion](https://github.com/TanStack/query/discussions/9065).

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
