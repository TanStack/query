---
id: UseBaseQueryOptions
title: UseBaseQueryOptions
---

Defined in: [preact-query/src/types.ts:30](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L30)

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

Defined in: [preact-query/src/types.ts:47](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L47)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
