---
id: UseSuspenseQueryOptions
title: UseSuspenseQueryOptions
---

Defined in: [preact-query/src/types.ts:158](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L158)

The options accepted by `useSuspenseQuery`. Same as [UseQueryOptions](UseQueryOptions.md), minus `enabled`, `throwOnError`,
and `placeholderData` — Suspense hooks cannot render a "disabled" or "placeholder" state, so those options
don't apply.

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

Defined in: [preact-query/src/types.ts:171](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L171)

`skipToken` is not allowed here — Suspense hooks cannot render a "disabled" state, so a query function
must always be provided, unless a default query function has been defined.

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:55](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L55)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
