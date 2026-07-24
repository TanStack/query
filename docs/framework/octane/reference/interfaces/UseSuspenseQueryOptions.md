---
id: UseSuspenseQueryOptions
title: UseSuspenseQueryOptions
---

# Interface: UseSuspenseQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: packages/octane-query/src/types.ts:86

## Extends

- `OmitKeyof`\<[`UseQueryOptions`](UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"` \| `"enabled"` \| `"throwOnError"` \| `"placeholderData"`\>

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

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, never>;
```

Defined in: packages/octane-query/src/types.ts:95

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: packages/octane-query/src/types.ts:51

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
