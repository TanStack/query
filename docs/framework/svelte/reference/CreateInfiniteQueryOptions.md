---
id: CreateInfiniteQueryOptions
title: CreateInfiniteQueryOptions
---

# Type Alias: CreateInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam\>

```ts
type CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>: InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam>;
```

Options for createInfiniteQuery

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryData** = `TQueryFnData`

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:52](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/types.ts#L52)
