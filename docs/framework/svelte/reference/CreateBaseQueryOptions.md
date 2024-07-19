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

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/types.ts:23](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/types.ts#L23)
