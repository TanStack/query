---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

# Function: useSuspenseInfiniteQuery()

```ts
function useSuspenseInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseSuspenseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useSuspenseInfiniteQuery.ts:18](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseInfiniteQuery.ts#L18)

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `Error`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`UseSuspenseInfiniteQueryOptions`](../interfaces/UseSuspenseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

### queryClient?

`QueryClient`

## Returns

[`UseSuspenseInfiniteQueryResult`](../type-aliases/UseSuspenseInfiniteQueryResult.md)\<`TData`, `TError`\>
