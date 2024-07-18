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

• **options**: [`CreateInfiniteQueryOptions`](createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>

## Returns

[`CreateInfiniteQueryOptions`](createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>

## Defined in

[packages/svelte-query/src/infiniteQueryOptions.ts:4](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/infiniteQueryOptions.ts#L4)
