---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

Defined in: [preact-query/src/types.ts:236](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L236)

The options accepted by `useInfiniteQuery`. Extends InfiniteQueryObserverOptions from
`@tanstack/query-core` with the `preact-query`-specific `subscribed` option, minus `suspense` (which
`preact-query` derives from which hook you call rather than exposing as an option).

## Extends

- `OmitKeyof`\<`InfiniteQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"suspense"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
the shape of all fetched pages plus their page params.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.

## Properties

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:256](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L256)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
