---
id: CreateQueryOptions
title: CreateQueryOptions
---

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>, "notifyOnChangeProps" | "suspense" | "throwOnError">;
```

Defined in: [packages/angular-query/src/types.ts:28](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L28)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
