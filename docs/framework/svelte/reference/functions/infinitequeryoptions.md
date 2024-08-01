---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

# Function: infiniteQueryOptions()

```ts
function infiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(
  options,
): CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
>
```

## Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

## Parameters

• **options**: [`CreateInfiniteQueryOptions`](../type-aliases/createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>

## Returns

[`CreateInfiniteQueryOptions`](../type-aliases/createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>

## Defined in

[packages/svelte-query/src/infiniteQueryOptions.ts:4](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/infiniteQueryOptions.ts#L4)
