---
id: InfiniteQueryObserverOptions
title: InfiniteQueryObserverOptions
---

Defined in: [QueryClient.ts:62](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L62)

The core `InfiniteQueryObserverOptions`, with Solid's `reconcile` option added.

## Extends

- `OmitKeyof`\<`QueryCoreInfiniteQueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"structuralSharing"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.

## Properties

### reconcile?

```ts
optional reconcile: string | false | (oldData, newData) => TData;
```

Defined in: [QueryClient.ts:84](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L84)

Set this to a reconciliation key to enable reconciliation between query results.
Set this to `false` to disable reconciliation between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
Defaults reconciliation to false.
