---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

```ts
type UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = OmitKeyof<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, never>, "queryFn"> & object;
```

Defined in: [packages/vue-query/src/usePrefetchQuery.ts:19](https://github.com/TanStack/query/blob/main/packages/vue-query/src/usePrefetchQuery.ts#L19)

The options accepted by `usePrefetchQuery` — everything you can pass to `queryClient.query`, except that
`queryFn` can't be `skipToken`.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, never>["queryFn"], SkipToken>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError`

### TData

`TData`

### TQueryData

`TQueryData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md)
