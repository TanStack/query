---
id: UseBaseQueryOptions
title: UseBaseQueryOptions
---

Defined in: [preact-query/src/types.ts:38](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L38)

The options shared by `useQuery`, `useSuspenseQuery`, and their infinite counterparts. Extends
QueryObserverOptions from `@tanstack/query-core` with the `preact-query`-specific `subscribed` option.

## Extends

- `QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryData`, `TQueryKey`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

## Properties

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:55](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L55)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.
