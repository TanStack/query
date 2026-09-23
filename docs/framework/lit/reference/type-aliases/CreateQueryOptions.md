---
id: CreateQueryOptions
title: CreateQueryOptions
---

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/lit-query/src/createQueryController.ts:28](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueryController.ts#L28)

Options accepted by `createQueryController`.

This is the Lit adapter shape for `QueryObserverOptions`. It can be passed
directly to `createQueryController`, or wrapped in an `Accessor` when the
options depend on Lit host state.

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
