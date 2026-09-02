---
id: UndefinedInitialDataInfiniteOptions
title: UndefinedInitialDataInfiniteOptions
---

```ts
type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Accessor<InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object>;
```

Defined in: [infiniteQueryOptions.ts:24](https://github.com/TanStack/query/blob/main/packages/solid-query/src/infiniteQueryOptions.ts#L24)

The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set — `data`
may be `undefined` while the query is `pending`. Solid's reactivity applies where these options are
consumed (e.g. `useInfiniteQuery(() => options)`), not to the plain object `infiniteQueryOptions` itself
accepts and returns.

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
