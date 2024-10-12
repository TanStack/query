---
id: CreateBaseQueryOptions
title: CreateBaseQueryOptions
---

# Type Alias: CreateBaseQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

```ts
type CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Options for createBaseQuery

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/types.ts:23](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/types.ts#L23)
