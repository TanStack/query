---
id: UseBaseQueryOptions
title: UseBaseQueryOptions
---

# Interface: UseBaseQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

Defined in: [preact-query/src/types.ts:28](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L28)

## Extends

- `QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

## Properties

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:45](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L45)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
