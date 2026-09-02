---
id: UseBaseQueryOptions
title: UseBaseQueryOptions
---

Defined in: [types.ts:34](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L34)

The options accepted by `useQuery`. Extends [QueryObserverOptions](QueryObserverOptions.md) from `@tanstack/query-core` with
the `solid-query`-specific `deferStream` and `suspense` options.

## Extends

- `OmitKeyof`\<[`QueryObserverOptions`](QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>, `"suspense"`\>

## Extended by

- [`QueryOptions`](QueryOptions.md)

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

### TQueryData

`TQueryData` = `TQueryFnData`

The type of the data actually held in the query cache — the input to `select` and
`placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

## Properties

### deferStream?

```ts
optional deferStream: boolean;
```

Defined in: [types.ts:50](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L50)

Only applicable while rendering queries on the server with streaming.
Set `deferStream` to `true` to wait for the query to resolve on the server before flushing the stream.
This can be useful to avoid sending a loading state to the client before the query has resolved.
Defaults to `false`.

***

### reconcile?

```ts
optional reconcile: string | false | (oldData, newData) => TData;
```

Defined in: [QueryClient.ts:47](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L47)

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

Defined in: [types.ts:56](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L56)

#### Deprecated

The `suspense` option has been deprecated in v5 and will be removed in the next major version.
The `data` property on useQuery is a SolidJS resource and will automatically suspend when the data is loading.
Setting `suspense` to `false` will be a no-op.
