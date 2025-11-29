---
id: FetchInfiniteQueryOptions
title: FetchInfiniteQueryOptions
---

# Type Alias: FetchInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

```ts
type FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Omit<FetchQueryOptions<TQueryFnData, TError, InfiniteData<TData, TPageParam>, TQueryKey, TPageParam>, "initialPageParam"> & InitialPageParam<TPageParam> & FetchInfiniteQueryPages<TQueryFnData, TPageParam>;
```

Defined in: [packages/query-core/src/types.ts:548](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L548)

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
