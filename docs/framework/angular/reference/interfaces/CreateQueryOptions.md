---
id: CreateQueryOptions
title: CreateQueryOptions
---

Defined in: [types.ts:58](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L58)

The options accepted by `injectQuery`. Same as [CreateBaseQueryOptions](CreateBaseQueryOptions.md), minus `suspense` — which
`angular-query-experimental` doesn't support, unlike `react-query`.

## Extends

- `OmitKeyof`\<[`CreateBaseQueryOptions`](CreateBaseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`\>, `"suspense"`\>

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
