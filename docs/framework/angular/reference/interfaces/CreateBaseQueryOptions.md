---
id: CreateBaseQueryOptions
title: CreateBaseQueryOptions
---

Defined in: [types.ts:34](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L34)

The options shared across `angular-query-experimental`'s query functions. Extends
QueryObserverOptions from `@tanstack/query-core` as-is — unlike `react-query`,
`angular-query-experimental` has no extra framework-specific option here.

## Extends

- `QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

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

### TQueryData

`TQueryData` = `TQueryFnData`

The type of the data actually held in the query cache — the input to `select` and
`placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.
