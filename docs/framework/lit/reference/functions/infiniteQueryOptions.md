---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [packages/lit-query/src/infiniteQueryOptions.ts:28](https://github.com/TanStack/query/blob/main/packages/lit-query/src/infiniteQueryOptions.ts#L28)

Brands infinite query options so the `queryKey` carries the infinite query
data and error types across TanStack Query APIs.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `Error`

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

Infinite query options to preserve and brand.

## Returns

[`InfiniteQueryObserverOptions`](../interfaces/InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The same options object with a typed `queryKey`.

## Example

```ts
import { infiniteQueryOptions } from '@tanstack/lit-query'

const projectsOptions = infiniteQueryOptions({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```
