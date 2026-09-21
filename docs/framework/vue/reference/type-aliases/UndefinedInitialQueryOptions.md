---
id: UndefinedInitialQueryOptions
title: UndefinedInitialQueryOptions
---

```ts
type UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & WithUndefinedInitialData<TQueryFnData>;
```

Defined in: [packages/vue-query/src/queryOptions.ts:172](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L172)

The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
`undefined` while the query is `pending`.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.
