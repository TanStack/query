---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

Defined in: [preact-query/src/types.ts:139](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L139)

## Extends

- `OmitKeyof`\<`InfiniteQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"suspense"`\>

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

## Properties

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:159](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L159)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
