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

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/types.ts:38](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/types.ts#L38)
