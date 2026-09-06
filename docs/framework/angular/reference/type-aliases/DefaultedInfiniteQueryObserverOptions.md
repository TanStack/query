---
id: DefaultedInfiniteQueryObserverOptions
title: DefaultedInfiniteQueryObserverOptions
---

```ts
type DefaultedInfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = WithRequired<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "throwOnError" | "refetchOnReconnect" | "queryHash">;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:302

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
