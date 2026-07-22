---
id: usePrefetchQuery
title: usePrefetchQuery
---

# Function: usePrefetchQuery()

```ts
function usePrefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): void;
```

Defined in: packages/octane-query/src/usePrefetch.ts:13

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### options

[`UsePrefetchQueryOptions`](../interfaces/UsePrefetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### queryClient?

`QueryClient`

## Returns

`void`
