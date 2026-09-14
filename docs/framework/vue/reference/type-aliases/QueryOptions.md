---
id: QueryOptions
title: QueryOptions
---

```ts
type QueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = { [Property in keyof QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>]: Property extends "enabled" ? MaybeRefOrGetter<boolean | undefined> | (() => QueryBooleanOption<TQueryFnData, TError, TQueryData, DeepUnwrapRef<TQueryKey>>) : Property extends "queryKey" ? MaybeRefOrGetter<TQueryKey> : QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, DeepUnwrapRef<TQueryKey>>[Property] } & ShallowOption;
```

Defined in: [packages/vue-query/src/queryOptions.ts:35](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L35)

The options accepted by `queryOptions`, `useQuery`, and the other query hooks. `enabled` tracks reactive
dependencies automatically as a `ref`, a plain value, or a reactive getter (`() => ...`). `queryKey` reacts
through a `ref` for the array itself, or `ref`s and reactive getters as individual entries — the array
itself can't be a bare getter. Other options passed this way are read once and are not reactive.

If you instead pass a getter for the whole options object (`useQuery(() => ({ ... }))`), every option
inside it — including `staleTime`, `retry`, and `select` — is re-evaluated whenever the getter's own
reactive dependencies change, since the entire object is recomputed.

`select` only re-runs when `data` changes, or when the `select` function's own reference changes. Since a
Vue `setup()` function runs only once per component instance, an inline `select` function passed directly
to `queryOptions`/`useQuery` already has a stable reference across reactive updates. An inline `select`
created inside a whole-options getter is recreated — and so can change reference — every time that getter
re-evaluates.

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
