---
id: DefaultedQueryObserverOptions
title: DefaultedQueryObserverOptions
---

```ts
type DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = WithRequired<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "throwOnError" | "refetchOnReconnect" | "queryHash">;
```

Defined in: [packages/query-core/src/types.ts:528](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L528)

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
