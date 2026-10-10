---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

```ts
type UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = MaybeRef<{ [Property in keyof InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>]: Property extends "enabled" ? MaybeRefOrGetter<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, DeepUnwrapRef<TQueryKey>, TPageParam>[Property]> : MaybeRefDeep<InfiniteQueryObserverOptions<TQueryFnData, TError, TData, DeepUnwrapRef<TQueryKey>, TPageParam>[Property]> } & ShallowOption>;
```

Defined in: [packages/vue-query/src/useInfiniteQuery.ts:32](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useInfiniteQuery.ts#L32)

The options accepted by `useInfiniteQuery`. Same as [InfiniteQueryObserverOptions](../interfaces/InfiniteQueryObserverOptions.md) from
`@tanstack/query-core`, plus the `shallow` option. Each option except `shallow` can also be a `ref` (and
`enabled` a reactive getter).

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
