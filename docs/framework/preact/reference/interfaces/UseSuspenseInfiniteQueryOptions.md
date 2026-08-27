---
id: UseSuspenseInfiniteQueryOptions
title: UseSuspenseInfiniteQueryOptions
---

Defined in: [preact-query/src/types.ts:279](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L279)

The options accepted by `useSuspenseInfiniteQuery`. Same as [UseInfiniteQueryOptions](UseInfiniteQueryOptions.md), minus `enabled`,
`throwOnError`, and `placeholderData` — Suspense hooks cannot render a "disabled" or "placeholder" state, so
those options don't apply.

## Extends

- `OmitKeyof`\<[`UseInfiniteQueryOptions`](UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"` \| `"enabled"` \| `"throwOnError"` \| `"placeholderData"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
the shape of all fetched pages plus their page params.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.

## Properties

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: [preact-query/src/types.ts:293](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L293)

`skipToken` is not allowed here — Suspense hooks cannot render a "disabled" state, so a query function
must always be provided, unless a default query function has been defined.

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:258](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L258)

Set this to `false` to unsubscribe this observer from updates to the query cache.

#### Default Value

```ts
true
```

#### Inherited from

```ts
OmitKeyof.subscribed
```
