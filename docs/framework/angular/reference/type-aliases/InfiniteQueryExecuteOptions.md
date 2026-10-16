---
id: InfiniteQueryExecuteOptions
title: InfiniteQueryExecuteOptions
---

```ts
type InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Omit<QueryExecuteOptions<TQueryFnData, TError, TData, InfiniteData<TQueryFnData, TPageParam>, TQueryKey, TPageParam>, "initialPageParam"> & InitialPageParam<TPageParam> & InfiniteQueryPages<TQueryFnData, TPageParam>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:522

The options of `queryClient.infiniteQuery`: like [QueryExecuteOptions](../interfaces/QueryExecuteOptions.md), with the
`initialPageParam`, and optionally `pages` together with `getNextPageParam` to fetch that many
pages at once.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `unknown`
