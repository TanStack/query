---
id: UseInfiniteQueryOptions
title: UseInfiniteQueryOptions
---

Defined in: [react-query/src/types.ts:238](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L238)

The options accepted by `useInfiniteQuery`. Extends InfiniteQueryObserverOptions from
`@tanstack/query-core` with the `react-query`-specific `subscribed` option, minus `suspense` (which
`react-query` derives from which hook you call rather than exposing as an option).

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

Defined in: [react-query/src/types.ts:259](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L259)

Set this to `false` to unsubscribe this observer from updates to the query cache.

#### Default Value

```ts
true
```
