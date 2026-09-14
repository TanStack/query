---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

```ts
type UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Accessor<InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>;
```

Defined in: [packages/solid-query/src/types.ts:199](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L199)

The accessor `useInfiniteQuery` expects as its first argument — Solid re-evaluates it reactively, so
`queryKey` and other options can depend on signals.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.
