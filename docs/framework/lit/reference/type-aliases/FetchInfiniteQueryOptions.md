---
id: FetchInfiniteQueryOptions
title: FetchInfiniteQueryOptions
---

```ts
type FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Omit<FetchQueryOptions<TQueryFnData, TError, InfiniteData<TData, TPageParam>, TQueryKey, TPageParam>, "initialPageParam"> & InitialPageParam<TPageParam> & InfiniteQueryPages<TQueryFnData, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:675](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L675)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `unknown`

## Deprecated
