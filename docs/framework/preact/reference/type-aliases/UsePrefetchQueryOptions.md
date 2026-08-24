---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

```ts
type UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = DistributiveOmit<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, "queryFn"> & object;
```

Defined in: [preact-query/src/types.ts:50](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L50)

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>["queryFn"], SkipToken>;
```

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
