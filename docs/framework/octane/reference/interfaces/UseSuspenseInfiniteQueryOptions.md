---
id: UseSuspenseInfiniteQueryOptions
title: UseSuspenseInfiniteQueryOptions
---

# Interface: UseSuspenseInfiniteQueryOptions\<TQueryFnData, TError, TData, TQueryKey, TPageParam\>

Defined in: packages/octane-query/src/types.ts:133

## Extends

- `OmitKeyof`\<[`UseInfiniteQueryOptions`](UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"` \| `"enabled"` \| `"throwOnError"` \| `"placeholderData"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`

## Properties

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: packages/octane-query/src/types.ts:143

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: packages/octane-query/src/types.ts:128

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
