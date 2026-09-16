---
id: DefinedInitialQueryOptions
title: DefinedInitialQueryOptions
---

```ts
type DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & WithDefinedInitialData<TQueryFnData>;
```

Defined in: [packages/vue-query/src/queryOptions.ts:189](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L189)

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
