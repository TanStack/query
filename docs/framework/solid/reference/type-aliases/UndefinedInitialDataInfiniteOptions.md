---
id: UndefinedInitialDataInfiniteOptions
title: UndefinedInitialDataInfiniteOptions
---

```ts
type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = Accessor<InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object>;
```

Defined in: [packages/solid-query/src/infiniteQueryOptions.ts:25](https://github.com/TanStack/query/blob/main/packages/solid-query/src/infiniteQueryOptions.ts#L25)

The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set — `data`
may be `undefined` while the query is `pending`. `infiniteQueryOptions` itself accepts and returns a plain
object (its parameter type is `ReturnType<UndefinedInitialDataInfiniteOptions<...>>`, i.e. this `Accessor`
called); Solid's reactivity applies where the result is consumed instead, e.g.
`useInfiniteQuery(() => options)`.

## Type Parameters

### TQueryFnData

`TQueryFnData`

The type of a single page, as your `queryFn` resolves it.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = [`InfiniteData`](../interfaces/InfiniteData.md)\<`TQueryFnData`\>

The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
the shape of all fetched pages plus their page params.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.

### TPageParam

`TPageParam` = `unknown`

The type of the parameter passed to `queryFn` to fetch a given page.
