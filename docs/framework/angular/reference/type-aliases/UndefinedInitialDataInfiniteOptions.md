---
id: UndefinedInitialDataInfiniteOptions
title: UndefinedInitialDataInfiniteOptions
---

```ts
type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [infinite-query-options.ts:24](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L24)

The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set — `data`
may be `undefined` while the query is `pending`.

## Type Declaration

### initialData?

```ts
optional initialData: 
  | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
| InitialDataFunction<NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>>;
```

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet). If set to a function, the function will be called **once** during the shared/root
query initialization, and be expected to synchronously return the initial data. Initial data is
considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
cache.

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
