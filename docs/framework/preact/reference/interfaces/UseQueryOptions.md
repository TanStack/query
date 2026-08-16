---
id: UseQueryOptions
title: UseQueryOptions
---

Defined in: [preact-query/src/types.ts:64](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L64)

## Extends

- `OmitKeyof`\<[`UseBaseQueryOptions`](UseBaseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`\>, `"suspense"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

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

#### Inherited from

```ts
OmitKeyof.subscribed
```
