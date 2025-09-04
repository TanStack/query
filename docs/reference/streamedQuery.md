---
id: streamedQuery
title: streamedQuery
---

`streamedQuery` is a helper function to create a query function that streams data from an [AsyncIterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator). Data will be an Array of all the chunks received. The query will be in a `pending` state until the first chunk of data is received, but will go to `success` after that. The query will stay in fetchStatus `fetching` until the stream ends.

To see `streamedQuery` in action, take a look at our chat example in the [examples/react/chat directory on GitHub](https://github.com/TanStack/query/tree/main/examples/react/chat).

```tsx
import { experimental_streamedQuery as streamedQuery } from '@tanstack/react-query'

const query = queryOptions({
  queryKey: ['data'],
  queryFn: streamedQuery({
    streamFn: fetchDataInChunks,
  }),
})
```

> Note: `streamedQuery` is currently marked as `experimental` because we want to gather feedback from the community. If you've tried out the API and have feedback for us, please provide it in this [GitHub discussion](https://github.com/TanStack/query/discussions/9065).

**Options**

- `streamFn: (context: QueryFunctionContext) => Promise<AsyncIterable<TData>>`
  - **Required**
  - The function that returns a Promise of an AsyncIterable with data to stream in.
  - Receives a [QueryFunctionContext](../../framework/react/guides/query-functions.md#queryfunctioncontext)
- `refetchMode?: 'append' | 'reset' | 'replace`
  - Optional
  - Defines how refetches are handled.
  - Defaults to `'reset'`
  - When set to `'reset'`, the query will erase all data and go back into `pending` state.
  - When set to `'append'`, data will be appended to existing data.
  - When set to `'replace'`, all data will be written to the cache once the stream ends.
- `reducer?: (accumulator: TData, chunk: TQueryFnData) => TData`
  - Optional
  - Reduces streamed chunks (`TQueryFnData`) into the final data shape (`TData`).
  - Default: appends each chunk to the end of the accumulator when `TData` is an array.
  - If `TData` is not an array, you must provide a custom `reducer`.
- `initialValue?: TData = TQueryFnData`
  - Optional
  - Defines the initial data to be used while the first chunk is being fetched.
  - It is mandatory when custom `reducer` is provided.
  - Defaults to an empty array.
