---
id: InfiniteQueryControllerOptions
title: InfiniteQueryControllerOptions
---

```ts
type InfiniteQueryControllerOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Accessor<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>;
```

Defined in: [packages/lit-query/src/types.ts:41](https://github.com/TanStack/query/blob/main/packages/lit-query/src/types.ts#L41)

Accessor-wrapped options accepted by `createInfiniteQueryController`.

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
