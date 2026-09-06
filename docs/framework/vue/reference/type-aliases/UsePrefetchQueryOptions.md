---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

```ts
type UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = OmitKeyof<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, never>, "queryFn"> & object;
```

Defined in: [packages/vue-query/src/usePrefetchQuery.ts:15](https://github.com/TanStack/query/blob/main/packages/vue-query/src/usePrefetchQuery.ts#L15)

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, never>["queryFn"], SkipToken>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError`

### TData

`TData`

### TQueryData

`TQueryData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md)
