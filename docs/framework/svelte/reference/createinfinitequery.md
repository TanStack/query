# Function: createInfiniteQuery()

```ts
function createInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>
```

## Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

## Parameters

• **options**: [`StoreOrVal`](storeorval.md)\<[`CreateInfiniteQueryOptions`](createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>\>

• **queryClient?**: `QueryClient`

## Returns

[`CreateInfiniteQueryResult`](createinfinitequeryresult.md)\<`TData`, `TError`\>

## Defined in

[packages/svelte-query/src/createInfiniteQuery.ts:16](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/createInfiniteQuery.ts#L16)
