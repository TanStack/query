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

• **TQueryKey** *extends* readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

## Parameters

### options

[`StoreOrVal`](../../type-aliases/storeorval.md)\<[`CreateInfiniteQueryOptions`](../../type-aliases/createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>\>

### queryClient?

`QueryClient`

## Returns

[`CreateInfiniteQueryResult`](../../type-aliases/createinfinitequeryresult.md)\<`TData`, `TError`\>

## Defined in

[packages/svelte-query/src/createInfiniteQuery.ts:16](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L16)
