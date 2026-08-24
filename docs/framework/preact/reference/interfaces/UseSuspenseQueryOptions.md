---
id: UseSuspenseQueryOptions
title: UseSuspenseQueryOptions
---

Defined in: [preact-query/src/types.ts:123](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L123)

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

Defined in: [preact-query/src/types.ts:136](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L136)

`skipToken` is not allowed here — Suspense hooks cannot render a "disabled" state, so a query function
must always be provided.

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
