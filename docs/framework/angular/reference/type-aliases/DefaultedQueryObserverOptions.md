---
id: DefaultedQueryObserverOptions
title: DefaultedQueryObserverOptions
---

```ts
type DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = WithRequired<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "throwOnError" | "refetchOnReconnect" | "queryHash">;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:455

The [QueryObserverOptions](../interfaces/QueryObserverOptions.md) after `QueryClient#defaultQueryOptions` has applied the
defaults, so `throwOnError`, `refetchOnReconnect`, and `queryHash` are always set.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
