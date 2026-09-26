---
id: UsePrefetchInfiniteQueryOptions
title: UsePrefetchInfiniteQueryOptions
---

```ts
type UsePrefetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = DistributiveOmit<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object;
```

Defined in: [packages/react-query/src/types.ts:118](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L118)

The options accepted by `usePrefetchInfiniteQuery` — everything you can pass to `queryClient.infiniteQuery`,
except `queryFn` is required unless a default query function has been defined.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<InfiniteQueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>["queryFn"], SkipToken>;
```

`skipToken` is not allowed as a value here — a prefetch always needs a query function to actually run,
unless a default query function has been defined.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

The type `data` ends up as after `select` runs. Defaults to `InfiniteData<TQueryFnData>`,
the shape of all fetched pages plus their page params — a prefetch never reads `data` back out, so this
parameter only matters if you reuse these options elsewhere with `select` applied.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.
