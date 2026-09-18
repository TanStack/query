---
id: EnsureInfiniteQueryDataOptions
title: EnsureInfiniteQueryDataOptions
---

```ts
type EnsureInfiniteQueryDataOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [packages/query-core/src/types.ts:644](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L644)

## Type Declaration

### ~~revalidateIfStale?~~

```ts
optional revalidateIfStale: boolean;
```

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

## Deprecated
