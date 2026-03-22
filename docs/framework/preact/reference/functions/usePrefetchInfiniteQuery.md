---
id: usePrefetchInfiniteQuery
title: usePrefetchInfiniteQuery
---

# Function: usePrefetchInfiniteQuery()

```ts
function usePrefetchInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): void;
```

Defined in: [preact-query/src/usePrefetchInfiniteQuery.tsx:9](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/usePrefetchInfiniteQuery.tsx#L9)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

`FetchInfiniteQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

### queryClient?

`QueryClient`

## Returns

`void`
