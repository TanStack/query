---
id: CreateInfiniteQueryOptions
title: CreateInfiniteQueryOptions
---

# Type Alias: CreateInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam\>

```ts
type CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>
```

Options for createInfiniteQuery

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:53](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L53)
