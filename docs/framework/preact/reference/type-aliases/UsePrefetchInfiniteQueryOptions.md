---
id: UsePrefetchInfiniteQueryOptions
title: UsePrefetchInfiniteQueryOptions
---

```ts
type UsePrefetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = DistributiveOmit<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object;
```

Defined in: [preact-query/src/types.ts:72](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L72)

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>["queryFn"], SkipToken>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`
