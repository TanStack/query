---
id: QueryOptions
title: QueryOptions
---

```ts
type QueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = { [Property in keyof QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>]: Property extends "enabled" ? MaybeRefOrGetter<boolean | undefined> | (() => QueryBooleanOption<TQueryFnData, TError, TQueryData, DeepUnwrapRef<TQueryKey>>) : Property extends "queryKey" ? MaybeRefOrGetter<TQueryKey> : QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, DeepUnwrapRef<TQueryKey>>[Property] } & ShallowOption;
```

Defined in: [vue-query/src/queryOptions.ts:29](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L29)

The options accepted by `queryOptions`, `useQuery`, and the other query hooks. `queryKey` and `enabled`
track reactive dependencies — pass a `ref`, a plain value, or a reactive getter (`() => ...`) and the query
reacts to changes without any extra wiring. Other options are read once and are not reactive.

`select` only re-runs when `data` changes, or when the `select` function's own reference changes. Since a
Vue `setup()` function runs only once per component instance, an inline `select` function already has a
stable reference across reactive updates — you don't need `computed` or a stable reference of your own to
avoid re-running it unnecessarily.

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

### TQueryData

`TQueryData` = `TQueryFnData`

The type of data stored in the cache, before `select` runs — equal to `TQueryFnData`
unless `select` narrows it.

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

The type of your `queryKey`.
