---
id: InfiniteQueryExecuteOptions
title: InfiniteQueryExecuteOptions
---

```ts
type InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Omit<QueryExecuteOptions<TQueryFnData, TError, TData, InfiniteData<TQueryFnData, TPageParam>, TQueryKey, TPageParam>, "initialPageParam"> & InitialPageParam<TPageParam> & InfiniteQueryPages<TQueryFnData, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:654](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L654)

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
