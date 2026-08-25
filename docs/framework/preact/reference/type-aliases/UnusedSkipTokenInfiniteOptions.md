---
id: UnusedSkipTokenInfiniteOptions
title: UnusedSkipTokenInfiniteOptions
---

```ts
type UnusedSkipTokenInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = OmitKeyof<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:51](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L51)

The options accepted by the `infiniteQueryOptions` overload selected when no `initialData` is set and
`queryFn` is not `skipToken` — same as [UndefinedInitialDataInfiniteOptions](UndefinedInitialDataInfiniteOptions.md), but `queryFn` may not be
`skipToken`.

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>["queryFn"], SkipToken | undefined>;
```

`skipToken` is not allowed as a value here — this overload is selected when no `initialData` is set. If
you don't intend to run the query yet, omit `queryFn` or use a default query function instead.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `DefaultError`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`
