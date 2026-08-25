---
id: UseSuspenseInfiniteQueryOptions
title: UseSuspenseInfiniteQueryOptions
---

Defined in: [preact-query/src/types.ts:227](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L227)

The options accepted by `useSuspenseInfiniteQuery`. Same as [UseInfiniteQueryOptions](UseInfiniteQueryOptions.md), minus `enabled`,
`throwOnError`, and `placeholderData` — Suspense hooks cannot render a "disabled" or "placeholder" state, so
those options don't apply.

## Extends

- `OmitKeyof`\<[`UseInfiniteQueryOptions`](UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"` \| `"enabled"` \| `"throwOnError"` \| `"placeholderData"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`

## Properties

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: [preact-query/src/types.ts:241](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L241)

`skipToken` is not allowed here — Suspense hooks cannot render a "disabled" state, so a query function
must always be provided, unless a default query function has been defined.

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:213](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L213)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
