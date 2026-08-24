---
id: usePrefetchQuery
title: usePrefetchQuery
---

```ts
function usePrefetchQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>(options, queryClient?): void;
```

Defined in: [preact-query/src/usePrefetchQuery.tsx:7](https://github.com/TanStack/query/blob/main/packages/preact-query/src/usePrefetchQuery.tsx#L7)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

## Parameters

### options

[`UsePrefetchQueryOptions`](../type-aliases/UsePrefetchQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

### queryClient?

`QueryClient`

## Returns

`void`
