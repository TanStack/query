---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = Accessor<QueryOptions<TQueryFnData, TError, TData, TQueryKey> & object>;
```

Defined in: [queryOptions.ts:19](https://github.com/TanStack/query/blob/main/packages/solid-query/src/queryOptions.ts#L19)

The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
`undefined` while the query is `pending`. Solid's reactivity applies where these options are consumed (e.g.
`useQuery(() => options)`), not to the plain object `queryOptions` itself accepts and returns.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.
