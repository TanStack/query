---
id: CreateQueryOptions
title: CreateQueryOptions
---

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> = CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>;
```

Defined in: [packages/svelte-query/src/types.ts:40](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L40)

Options for createQuery

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
