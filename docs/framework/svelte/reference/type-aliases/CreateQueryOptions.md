---
id: CreateQueryOptions
title: CreateQueryOptions
---

# Type Alias: CreateQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> = CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>;
```

Defined in: [packages/svelte-query/src/types.ts:39](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L39)

Options for createQuery

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
