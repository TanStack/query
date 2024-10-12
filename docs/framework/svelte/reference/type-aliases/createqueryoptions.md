---
id: CreateQueryOptions
title: CreateQueryOptions
---

# Type Alias: CreateQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>: CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>;
```

Options for createQuery

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/types.ts:38](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/types.ts#L38)
