---
id: QueryOptions
title: QueryOptions
---

Defined in: [types.ts:67](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L67)

The options accepted by `useQuery` and `queryOptions`.

## Extends

- [`UseBaseQueryOptions`](UseBaseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
`select` is used.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

## Properties

### deferStream?

```ts
optional deferStream: boolean;
```

Defined in: [types.ts:49](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L49)

Only applicable while rendering queries on the server with streaming.
Set `deferStream` to `true` to wait for the query to resolve on the server before flushing the stream.
This can be useful to avoid sending a loading state to the client before the query has resolved.
Defaults to `false`.

#### Inherited from

[`UseBaseQueryOptions`](UseBaseQueryOptions.md).[`deferStream`](UseBaseQueryOptions.md#deferstream)

***

### reconcile?

```ts
optional reconcile: string | false | (oldData, newData) => TData;
```

Defined in: [QueryClient.ts:45](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L45)

Set this to a reconciliation key to enable reconciliation between query results.
Set this to `false` to disable reconciliation between query results.
Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
Defaults reconciliation to false.

#### Inherited from

[`UseBaseQueryOptions`](UseBaseQueryOptions.md).[`reconcile`](UseBaseQueryOptions.md#reconcile)

***

### ~~suspense?~~

```ts
optional suspense: boolean;
```

Defined in: [types.ts:55](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L55)

#### Deprecated

The `suspense` option has been deprecated in v5 and will be removed in the next major version.
The `data` property on useQuery is a SolidJS resource and will automatically suspend when the data is loading.
Setting `suspense` to `false` will be a no-op.

#### Inherited from

[`UseBaseQueryOptions`](UseBaseQueryOptions.md).[`suspense`](UseBaseQueryOptions.md#suspense)
