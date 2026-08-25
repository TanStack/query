---
id: UsePrefetchInfiniteQueryOptions
title: UsePrefetchInfiniteQueryOptions
---

```ts
type UsePrefetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = DistributiveOmit<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object;
```

Defined in: [preact-query/src/types.ts:92](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L92)

The options accepted by `usePrefetchInfiniteQuery` — everything you can pass to `queryClient.infiniteQuery`,
except `queryFn` is required unless a default query function has been defined.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>["queryFn"], SkipToken>;
```

`skipToken` is not allowed as a value here — a prefetch always needs a query function to actually run,
unless a default query function has been defined.

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
