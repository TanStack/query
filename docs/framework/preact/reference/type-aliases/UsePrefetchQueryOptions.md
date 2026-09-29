---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

```ts
type UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = DistributiveOmit<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "queryFn"> & object;
```

Defined in: [packages/preact-query/src/types.ts:79](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L79)

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

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
`select` is used.

### TQueryData

`TQueryData` = `TQueryFnData`

The type of the data actually held in the query cache — the input to `select` and
`placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.
