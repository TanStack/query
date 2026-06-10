---
id: CreateInfiniteQueryOptions
title: CreateInfiniteQueryOptions
---

# Type Alias: CreateInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

```ts
type CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
```

Defined in: [packages/lit-query/src/createInfiniteQueryController.ts:27](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createInfiniteQueryController.ts#L27)

Options accepted by `createInfiniteQueryController`.

This is the Lit adapter shape for `InfiniteQueryObserverOptions`. Pass it
directly or through an `Accessor` when the options depend on Lit host state.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`
