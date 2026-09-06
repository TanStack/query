---
id: FetchInfiniteQueryOptions
title: FetchInfiniteQueryOptions
---

```ts
type FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Omit<FetchQueryOptions<TQueryFnData, TError, InfiniteData<TData, TPageParam>, TQueryKey, TPageParam>, "initialPageParam"> & InitialPageParam<TPageParam> & InfiniteQueryPages<TQueryFnData, TPageParam>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:337

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
