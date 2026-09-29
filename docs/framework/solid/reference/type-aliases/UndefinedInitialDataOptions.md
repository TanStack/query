---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = Accessor<QueryOptions<TQueryFnData, TError, TData, TQueryKey> & object>;
```

Defined in: [packages/solid-query/src/queryOptions.ts:20](https://github.com/TanStack/query/blob/main/packages/solid-query/src/queryOptions.ts#L20)

The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
`undefined` while the query is `pending`. `queryOptions` itself accepts and returns a plain object (its
parameter type is `ReturnType<UndefinedInitialDataOptions<...>>`, i.e. this `Accessor` called); Solid's
reactivity applies where the result is consumed instead, e.g. `useQuery(() => options)`.

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
