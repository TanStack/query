---
id: UndefinedInitialQueryOptionsWithDataTag
title: UndefinedInitialQueryOptionsWithDataTag
---

```ts
type UndefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & WithUndefinedInitialData<TQueryFnData> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/vue-query/src/queryOptions.ts:199](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L199)

The options returned by the `queryOptions` overload selected when `initialData` is omitted or may be
`undefined`, with the `queryKey` tagged with the query's data and error types.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
