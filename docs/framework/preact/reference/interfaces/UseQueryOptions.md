---
id: UseQueryOptions
title: UseQueryOptions
---

Defined in: [preact-query/src/types.ts:164](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L164)

The options accepted by `useQuery`. Same as [UseBaseQueryOptions](UseBaseQueryOptions.md), minus `suspense` (which
`preact-query` derives from which hook you call rather than exposing as an option).

## Extends

- `OmitKeyof`\<[`UseBaseQueryOptions`](UseBaseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`\>, `"suspense"`\>

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
