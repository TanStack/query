---
id: UseBaseQueryOptions
title: UseBaseQueryOptions
---

Defined in: [preact-query/src/types.ts:46](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L46)

The options shared by `useQuery` and `useSuspenseQuery`. Extends QueryObserverOptions from
`@tanstack/query-core` with the `preact-query`-specific `subscribed` option.

## Extends

- `QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

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

### TQueryData

`TQueryData` = `TQueryFnData`

The type of the data actually held in the query cache — the input to `select` and
`placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

## Properties

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:63](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L63)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
