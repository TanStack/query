---
id: UseQueryOptions
title: UseQueryOptions
---

```ts
type UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> = Accessor<QueryOptions<TQueryFnData, TError, TData, TQueryKey>>;
```

Defined in: [types.ts:90](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L90)

The accessor `useQuery` expects as its first argument — Solid re-evaluates it reactively, so `queryKey` and
other options can depend on signals.

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

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.
