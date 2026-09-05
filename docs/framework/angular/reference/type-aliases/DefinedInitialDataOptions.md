---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = Omit<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object;
```

Defined in: [query-options.ts:80](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L80)

The options accepted by the `queryOptions` overload selected when `initialData` is set — `data` is never
`undefined` (unless a `select` changes `TData` to include `undefined`).

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

The type your `queryFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.
