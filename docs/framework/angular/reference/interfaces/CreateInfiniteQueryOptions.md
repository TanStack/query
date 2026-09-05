---
id: CreateInfiniteQueryOptions
title: CreateInfiniteQueryOptions
---

Defined in: [types.ts:121](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L121)

The options accepted by `injectInfiniteQuery`. Same as [CreateBaseQueryOptions](CreateBaseQueryOptions.md), minus `suspense` —
which `angular-query-experimental` doesn't support, unlike `react-query` — extends
InfiniteQueryObserverOptions from `@tanstack/query-core` for the infinite-query-specific options
(`getNextPageParam`, `initialPageParam`, etc.).

## Extends

- `OmitKeyof`\<`InfiniteQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"suspense"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` here, though
`injectInfiniteQuery` itself defaults it to `InfiniteData<TQueryFnData>` — the shape `data` actually has
when no `select` is used.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.
