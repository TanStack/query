---
id: experimental_streamedQuery
title: experimental_streamedQuery
---

# Function: experimental\_streamedQuery()

```ts
function experimental_streamedQuery<TQueryFnData, TData, TQueryKey>(queryFn): QueryFunction<TData, TQueryKey>;
```

Defined in: [packages/query-core/src/streamedQuery.ts:46](https://github.com/TanStack/query/blob/main/packages/query-core/src/streamedQuery.ts#L46)

This is a helper function to create a query function that streams data from an AsyncIterable.
Data will be an Array of all the chunks received.
The query will be in a 'pending' state until the first chunk of data is received, but will go to 'success' after that.
The query will stay in fetchStatus 'fetching' until the stream ends.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TData

`TData` = `TQueryFnData`[]

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### queryFn

`StreamedQueryParams`\<`TQueryFnData`, `TData`, `TQueryKey`\>

The function that returns an AsyncIterable to stream data from.

## Returns

[`QueryFunction`](../type-aliases/QueryFunction.md)\<`TData`, `TQueryKey`\>
