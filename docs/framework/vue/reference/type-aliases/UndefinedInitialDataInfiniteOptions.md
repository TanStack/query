---
id: UndefinedInitialDataInfiniteOptions
title: UndefinedInitialDataInfiniteOptions
---

```ts
type UndefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [packages/vue-query/src/infiniteQueryOptions.ts:21](https://github.com/TanStack/query/blob/main/packages/vue-query/src/infiniteQueryOptions.ts#L21)

The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set — `data`
may be `undefined` while the query is `pending`.

## Type Declaration

### initialData?

```ts
optional initialData: undefined;
```

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
