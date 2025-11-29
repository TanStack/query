---
id: CreateQueryOptions
title: CreateQueryOptions
---

# Interface: CreateQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: [types.ts:35](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L35)

## Extends

- `OmitKeyof`\<[`CreateBaseQueryOptions`](../../../../../CreateBaseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`\>, `"suspense"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
