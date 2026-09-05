---
id: CreateBaseQueryOptions
title: CreateBaseQueryOptions
---

```ts
type CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Defined in: [packages/svelte-query/src/types.ts:25](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L25)

Options for createBaseQuery

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
