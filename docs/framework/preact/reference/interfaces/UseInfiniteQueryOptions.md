---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

Defined in: [preact-query/src/types.ts:193](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L193)

The options accepted by `useInfiniteQuery`. Extends InfiniteQueryObserverOptions from
`@tanstack/query-core` with the `preact-query`-specific `subscribed` option, minus `suspense` (which
`preact-query` derives from which hook you call rather than exposing as an option).

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

Defined in: [preact-query/src/types.ts:213](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L213)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
