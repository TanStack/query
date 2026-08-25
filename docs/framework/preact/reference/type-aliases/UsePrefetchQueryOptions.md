---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

```ts
type UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = DistributiveOmit<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "queryFn"> & object;
```

Defined in: [preact-query/src/types.ts:78](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L78)

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

The type your `queryFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
`select` is used.

### TQueryData

`TQueryData` = `TQueryFnData`

The type `select` receives as input — usually the same as `TQueryFnData`, unless a
`queryFn` has been shared across queries with different `select` functions.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.
