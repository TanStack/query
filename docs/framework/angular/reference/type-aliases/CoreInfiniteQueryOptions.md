---
id: CoreInfiniteQueryOptions
title: CoreInfiniteQueryOptions
---

```ts
type CoreInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
```

Defined in: [packages/query-core/src/infiniteQueryOptions.ts:14](https://github.com/TanStack/query/blob/main/packages/query-core/src/infiniteQueryOptions.ts#L14)

Framework-agnostic options accepted by `infiniteQueryOptions`.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `unknown`
