---
id: QueryObserverOptions
title: QueryObserverOptions
---

Defined in: [QueryClient.ts:23](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L23)

The core `QueryObserverOptions`, with Solid's `reconcile` option added.

## Extends

- `OmitKeyof`\<`QueryCoreObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`, `TPageParam`\>, `"structuralSharing"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryData

`TQueryData` = `TQueryFnData`

The type of the data actually held in the query cache.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

### TPageParam

`TPageParam` = `never`

The type of the parameter passed to `queryFn` to fetch a given page, when this type
is shared with an infinite query's observer options. Defaults to `never` for regular queries.

## Properties

### reconcile?

```ts
optional reconcile: string | false | (oldData, newData) => TData;
```

Defined in: [QueryClient.ts:47](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L47)

Set this to a reconciliation key to enable reconciliation between query results.
Set this to `false` to disable reconciliation between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
Defaults reconciliation to false.
