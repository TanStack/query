---
id: UsePrefetchInfiniteQueryOptions
title: UsePrefetchInfiniteQueryOptions
---

```ts
type UsePrefetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = DistributiveOmit<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object;
```

Defined in: [packages/vue-query/src/usePrefetchInfiniteQuery.ts:16](https://github.com/TanStack/query/blob/main/packages/vue-query/src/usePrefetchInfiniteQuery.ts#L16)

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>["queryFn"], SkipToken>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError`

### TData

`TData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam`
