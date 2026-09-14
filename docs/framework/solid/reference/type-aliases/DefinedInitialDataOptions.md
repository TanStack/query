---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = Accessor<QueryOptions<TQueryFnData, TError, TData, TQueryKey> & object>;
```

Defined in: [packages/solid-query/src/queryOptions.ts:40](https://github.com/TanStack/query/blob/main/packages/solid-query/src/queryOptions.ts#L40)

The options accepted by the `queryOptions` overload selected when `initialData` is set — `data` is never
`undefined`.

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
