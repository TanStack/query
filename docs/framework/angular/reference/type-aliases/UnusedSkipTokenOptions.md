---
id: UnusedSkipTokenOptions
title: UnusedSkipTokenOptions
---

```ts
type UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object;
```

Defined in: [query-options.ts:50](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L50)

The options accepted by the `queryOptions` overload selected when no `initialData` is set and `queryFn` is
not `skipToken` — same as [UndefinedInitialDataOptions](UndefinedInitialDataOptions.md), but `queryFn` may not be `skipToken`.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>["queryFn"], SkipToken | undefined>;
```

`skipToken` is not allowed as a value here — this overload is selected when no `initialData` is set. If
you don't intend to run the query yet, set `enabled: false` — omitting `queryFn` alone still triggers a
fetch that fails with "Missing queryFn" unless `enabled` is `false` or a default query function has been
defined. A default query function only supplies `queryFn`; it doesn't defer the fetch on its own.

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
