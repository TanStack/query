---
id: CreateQueryOptions
title: CreateQueryOptions
---

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>, "notifyOnChangeProps" | "suspense" | "throwOnError">;
```

Defined in: [packages/angular-query/src/types.ts:23](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L23)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
