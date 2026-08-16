---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

# Interface: UseInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: [preact-query/src/types.ts:102](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L102)

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

Defined in: [preact-query/src/types.ts:122](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L122)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
