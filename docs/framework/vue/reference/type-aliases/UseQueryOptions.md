---
id: UseQueryOptions
title: UseQueryOptions
---

```ts
type UseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = MaybeRef<{ [Property in keyof QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>]: Property extends "enabled" ? MaybeRefOrGetter<boolean | undefined> | (() => QueryBooleanOption<TQueryFnData, TError, TQueryData, DeepUnwrapRef<TQueryKey>>) : Property extends "queryKey" ? MaybeRef<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>[Property]> : MaybeRefDeep<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, DeepUnwrapRef<TQueryKey>>[Property]> } & ShallowOption>;
```

Defined in: [packages/vue-query/src/useQuery.ts:22](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L22)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
