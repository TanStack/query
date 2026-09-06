---
id: DefaultedInfiniteQueryObserverOptions
title: DefaultedInfiniteQueryObserverOptions
---

```ts
type DefaultedInfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = WithRequired<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "throwOnError" | "refetchOnReconnect" | "queryHash">;
```

Defined in: [packages/query-core/src/types.ts:538](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L538)

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
