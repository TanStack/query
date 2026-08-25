---
id: UnusedSkipTokenOptions
title: UnusedSkipTokenOptions
---

```ts
type UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object;
```

Defined in: [preact-query/src/queryOptions.ts:41](https://github.com/TanStack/query/blob/main/packages/preact-query/src/queryOptions.ts#L41)

The options accepted by the `queryOptions` overload selected when no `initialData` is set and `queryFn` is
not `skipToken` — same as [UndefinedInitialDataOptions](UndefinedInitialDataOptions.md), but `queryFn` may not be `skipToken`.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>["queryFn"], SkipToken | undefined>;
```

`skipToken` is not allowed as a value here — this overload is selected when no `initialData` is set. If
you don't intend to run the query yet, omit `queryFn` or use a default query function instead.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
