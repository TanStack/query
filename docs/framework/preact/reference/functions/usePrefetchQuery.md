---
id: usePrefetchQuery
title: usePrefetchQuery
---

# Function: usePrefetchQuery()

```ts
function usePrefetchQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): void;
```

Defined in: [preact-query/src/usePrefetchQuery.tsx:6](https://github.com/TanStack/query/blob/main/packages/preact-query/src/usePrefetchQuery.tsx#L6)

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
