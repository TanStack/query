---
id: CreateQueryOptions
title: CreateQueryOptions
---

# Type Alias: CreateQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/lit-query/src/createQueryController.ts:27](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueryController.ts#L27)

Options accepted by `createQueryController`.

This is the Lit adapter shape for `QueryObserverOptions`. It can be passed
directly to `createQueryController`, or wrapped in an `Accessor` when the
options depend on Lit host state.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
