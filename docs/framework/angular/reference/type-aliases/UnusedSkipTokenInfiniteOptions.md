---
id: UnusedSkipTokenInfiniteOptions
title: UnusedSkipTokenInfiniteOptions
---

```ts
type UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = OmitKeyof<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object;
```

Defined in: [infinite-query-options.ts:64](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L64)

The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set and
`queryFn` is not `skipToken` — same as [UndefinedInitialDataInfiniteOptions](UndefinedInitialDataInfiniteOptions.md), but `queryFn` may not be
`skipToken`.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>["queryFn"], SkipToken | undefined>;
```

`skipToken` is not allowed as a value here — this overload is selected when no `initialData` is set. If
you don't intend to run the query yet, set `enabled: false` — omitting `queryFn` alone still triggers a
fetch that fails with "Missing queryFn" unless `enabled` is `false` or a default query function has been
defined. A default query function only supplies `queryFn`; it doesn't defer the fetch on its own.

## Type Parameters

### TQueryFnData

`TQueryFnData`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
the shape of all fetched pages plus their page params.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.
