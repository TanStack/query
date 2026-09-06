---
id: EnsureInfiniteQueryDataOptions
title: EnsureInfiniteQueryDataOptions
---

```ts
type EnsureInfiniteQueryDataOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:326

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
