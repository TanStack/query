---
id: UseSuspenseQueryOptions
title: UseSuspenseQueryOptions
---

Defined in: [preact-query/src/types.ts:195](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L195)

The options accepted by `useSuspenseQuery`. Same as [UseQueryOptions](UseQueryOptions.md), minus `enabled`, `throwOnError`,
and `placeholderData` — Suspense hooks cannot render a "disabled" or "placeholder" state, so those options
don't apply.

## Extends

- `OmitKeyof`\<[`UseQueryOptions`](UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"` \| `"enabled"` \| `"throwOnError"` \| `"placeholderData"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
`select` is used.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

## Properties

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, never>;
```

Defined in: [preact-query/src/types.ts:208](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L208)

`skipToken` is not allowed here — Suspense hooks cannot render a "disabled" state, so a query function
must always be provided, unless a default query function has been defined.

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:64](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L64)

Set this to `false` to unsubscribe this observer from updates to the query cache.

#### Default Value

```ts
true
```

#### Inherited from

```ts
OmitKeyof.subscribed
```
