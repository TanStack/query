---
id: CreateInfiniteQueryOptions
title: CreateInfiniteQueryOptions
---

```ts
type CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
```

Defined in: [packages/lit-query/src/createInfiniteQueryController.ts:28](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createInfiniteQueryController.ts#L28)

Options accepted by `createInfiniteQueryController`.

This is the Lit adapter shape for `InfiniteQueryObserverOptions`. Pass it
directly or through an `Accessor` when the options depend on Lit host state.

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
