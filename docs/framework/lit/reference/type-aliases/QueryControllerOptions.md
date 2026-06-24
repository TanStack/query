---
id: QueryControllerOptions
title: QueryControllerOptions
---

# Type Alias: QueryControllerOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

```ts
type QueryControllerOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> = Accessor<CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>;
```

Defined in: [packages/lit-query/src/types.ts:20](https://github.com/TanStack/query/blob/main/packages/lit-query/src/types.ts#L20)

Accessor-wrapped options accepted by `createQueryController`.

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
