---
id: CreateQueryOptions
title: CreateQueryOptions
---

# Type Alias: CreateQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>, "suspense">;
```

Defined in: [types.ts:29](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L29)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
