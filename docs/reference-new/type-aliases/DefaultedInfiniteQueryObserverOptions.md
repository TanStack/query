---
id: DefaultedInfiniteQueryObserverOptions
title: DefaultedInfiniteQueryObserverOptions
---

# Type Alias: DefaultedInfiniteQueryObserverOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

```ts
type DefaultedInfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = WithRequired<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "throwOnError" | "refetchOnReconnect" | "queryHash">;
```

Defined in: [packages/query-core/src/types.ts:474](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L474)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `unknown`
