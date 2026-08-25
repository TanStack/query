---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object;
```

Defined in: [preact-query/src/queryOptions.ts:18](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L18)

The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
`undefined` while the query is `pending`.

## Type Declaration

### initialData?

```ts
optional initialData: 
  | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
| NonUndefinedGuard<TQueryFnData>;
```

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet). If set to a function, the function will be called **once** during the shared/root
query initialization, and be expected to synchronously return the initial data. Initial data is
considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
cache.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
