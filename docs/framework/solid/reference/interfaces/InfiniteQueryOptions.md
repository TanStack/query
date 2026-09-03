---
id: InfiniteQueryOptions
title: InfiniteQueryOptions
---

Defined in: [types.ts:157](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L157)

The options accepted by `useInfiniteQuery`.

## Extends

- `OmitKeyof`\<[`InfiniteQueryObserverOptions`](InfiniteQueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryKey"` \| `"suspense"`\>

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

### deferStream?

```ts
optional deferStream: boolean;
```

Defined in: [types.ts:180](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L180)

Only applicable while rendering queries on the server with streaming.
Set `deferStream` to `true` to wait for the query to resolve on the server before flushing the stream.
This can be useful to avoid sending a loading state to the client before the query has resolved.
Defaults to `false`.

***

### queryKey

```ts
queryKey: TQueryKey;
```

Defined in: [types.ts:173](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L173)

***

### reconcile?

```ts
optional reconcile: string | false | (oldData, newData) => TData;
```

Defined in: [QueryClient.ts:84](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L84)

Set this to a reconciliation key to enable reconciliation between query results.
Set this to `false` to disable reconciliation between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
Defaults reconciliation to false.

#### Inherited from

```ts
OmitKeyof.reconcile
```

***

### ~~suspense?~~

```ts
optional suspense: boolean;
```

Defined in: [types.ts:186](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L186)

#### Deprecated

The `suspense` option has been deprecated in v5 and will be removed in the next major version.
The `data` property on useInfiniteQuery is a SolidJS resource and will automatically suspend when the data is loading.
Setting `suspense` to `false` will be a no-op.
