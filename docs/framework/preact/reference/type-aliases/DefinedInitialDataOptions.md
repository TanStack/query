---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object;
```

Defined in: [preact-query/src/queryOptions.ts:52](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L52)

## Type Declaration

### initialData

```ts
initialData: 
  | NonUndefinedGuard<TQueryFnData>
| () => NonUndefinedGuard<TQueryFnData>;
```

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet). If set to a function, the function will be called **once** during the shared/root
query initialization, and be expected to synchronously return the initial data. Initial data is
considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
cache.

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey>;
```

Optional here, but omitting it is only safe when no fetch will be attempted — for example with
`enabled: false`, or when a default query function has been defined. Otherwise, an enabled query with no
`queryFn` still tries to fetch and fails with a "Missing queryFn" error; `initialData` does not prevent this.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
