---
id: createInfiniteQuery
title: createInfiniteQuery
---

# Function: createInfiniteQuery()

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>
```

## Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

## Parameters

• **options**: [`StoreOrVal`](StoreOrVal.md)\<[`CreateInfiniteQueryOptions`](CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>\>

• **queryClient?**: `QueryClient`

## Returns

[`CreateInfiniteQueryResult`](CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

## Defined in

[packages/svelte-query/src/createInfiniteQuery.ts:16](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/createInfiniteQuery.ts#L16)
