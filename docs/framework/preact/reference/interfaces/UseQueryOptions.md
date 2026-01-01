---
id: UseQueryOptions
title: UseQueryOptions
---

# Interface: UseQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: [preact-query/src/types.ts:65](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/types.ts#L65)

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

Defined in: [preact-query/src/types.ts:46](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/types.ts#L46)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
