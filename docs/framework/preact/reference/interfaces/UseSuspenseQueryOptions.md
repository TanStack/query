---
id: UseSuspenseQueryOptions
title: UseSuspenseQueryOptions
---

# Interface: UseSuspenseQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: [preact-query/src/types.ts:80](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L80)

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

Defined in: [preact-query/src/types.ts:89](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L89)

***

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
