---
id: QueryOptions
title: QueryOptions
---

```ts
type QueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = { [Property in keyof QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>]: Property extends "enabled" ? MaybeRefOrGetter<boolean | undefined> | (() => QueryBooleanOption<TQueryFnData, TError, TQueryData, DeepUnwrapRef<TQueryKey>>) : Property extends "queryKey" ? MaybeRefOrGetter<TQueryKey> : QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, DeepUnwrapRef<TQueryKey>>[Property] } & ShallowOption;
```

Defined in: [packages/vue-query/src/queryOptions.ts:30](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L30)

The plain, unwrapped options that `queryOptions` hands back, and what `useQuery`, `useQueries`, and the
`queryClient` methods see once `ref`s have been resolved. To pass options in, use
[UseQueryOptions](UseQueryOptions.md), which accepts the same options as `ref`s and `computed`s too.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryData

`TQueryData` = `TQueryFnData`

The type of data stored in the cache, before `select` runs. Defaults to
`TQueryFnData` and can be configured independently of it.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.
