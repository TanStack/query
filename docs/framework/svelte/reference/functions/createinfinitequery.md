---
id: createInfiniteQuery
title: createInfiniteQuery
---

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

• **options**: [`StoreOrVal`](../type-aliases/storeorval.md)\<[`CreateInfiniteQueryOptions`](../type-aliases/createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>\>

• **queryClient?**: `QueryClient`

## Returns

[`CreateInfiniteQueryResult`](../type-aliases/createinfinitequeryresult.md)\<`TData`, `TError`\>

## Defined in

[packages/svelte-query/src/createInfiniteQuery.ts:16](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/createInfiniteQuery.ts#L16)
