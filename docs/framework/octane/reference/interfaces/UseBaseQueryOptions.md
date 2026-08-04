---
id: UseBaseQueryOptions
title: UseBaseQueryOptions
---

# Interface: UseBaseQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

Defined in: packages/octane-query/src/types.ts:34

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

Defined in: packages/octane-query/src/types.ts:51

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
