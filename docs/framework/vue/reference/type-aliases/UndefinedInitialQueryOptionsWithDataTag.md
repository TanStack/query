---
id: UndefinedInitialQueryOptionsWithDataTag
title: UndefinedInitialQueryOptionsWithDataTag
---

```ts
type UndefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & WithUndefinedInitialData<TQueryFnData> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/vue-query/src/queryOptions.ts:199](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L199)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
