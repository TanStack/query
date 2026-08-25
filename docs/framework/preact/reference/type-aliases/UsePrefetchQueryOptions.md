---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

```ts
type UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = DistributiveOmit<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "queryFn"> & object;
```

Defined in: [preact-query/src/types.ts:62](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L62)

The options accepted by `usePrefetchQuery` — everything you can pass to `queryClient.query`, except `queryFn`
is required unless a default query function has been defined.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>["queryFn"], SkipToken>;
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

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
