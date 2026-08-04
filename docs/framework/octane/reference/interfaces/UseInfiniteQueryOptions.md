---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

# Interface: UseInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: packages/octane-query/src/types.ts:108

## Extends

- `OmitKeyof`\<`InfiniteQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"suspense"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`

## Properties

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: packages/octane-query/src/types.ts:128

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
