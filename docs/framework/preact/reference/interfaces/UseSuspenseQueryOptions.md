---
id: UseSuspenseQueryOptions
title: UseSuspenseQueryOptions
---

Defined in: [preact-query/src/types.ts:117](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L117)

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

Defined in: [preact-query/src/types.ts:126](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L126)

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:47](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L47)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
