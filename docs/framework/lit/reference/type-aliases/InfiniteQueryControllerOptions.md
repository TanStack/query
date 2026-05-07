---
id: InfiniteQueryControllerOptions
title: InfiniteQueryControllerOptions
---

# Type Alias: InfiniteQueryControllerOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

```ts
type InfiniteQueryControllerOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Accessor<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>>;
```

Defined in: [packages/lit-query/src/types.ts:41](https://github.com/TanStack/query/blob/main/packages/lit-query/src/types.ts#L41)

Accessor-wrapped options accepted by `createInfiniteQueryController`.

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
