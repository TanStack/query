---
id: experimental_streamedQuery
title: experimental_streamedQuery
---

```ts
function experimental_streamedQuery<TQueryFnData, TData, TQueryKey>(options: StreamedQueryParams<TQueryFnData, TData, TQueryKey>): (context: object) => TData | Promise<TData>;
```

Defined in: [packages/query-core/src/streamedQuery.ts:69](https://github.com/TanStack/query/blob/main/packages/query-core/src/streamedQuery.ts#L69)

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

### options

`StreamedQueryParams`\<`TQueryFnData`, `TData`, `TQueryKey`\>

The `streamFn` that returns an AsyncIterable to stream data from, and the optional
`refetchMode`, `reducer`, and `initialValue` options.

## Returns

```ts
(context: object): TData | Promise<TData>;
```

### Parameters

#### context

##### client

[`QueryClient`](../classes/QueryClient.md)

##### direction?

`unknown`

**Deprecated**

if you want access to the direction, you can add it to the pageParam

##### meta

`Record`\<`string`, `unknown`\> \| `undefined`

##### pageParam?

`unknown`

##### queryKey

`TQueryKey`

##### signal

`AbortSignal`

### Returns

`TData` \| `Promise`\<`TData`\>

## Example

```ts
await queryClient.query({
  queryKey: ['data'],
  queryFn: streamedQuery({
    streamFn: fetchDataInChunks,
  }),
})
```
