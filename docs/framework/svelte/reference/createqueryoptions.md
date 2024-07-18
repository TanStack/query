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

[packages/svelte-query/src/types.ts:38](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/types.ts#L38)
