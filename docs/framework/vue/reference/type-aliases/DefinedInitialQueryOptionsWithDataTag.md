---
id: DefinedInitialQueryOptionsWithDataTag
title: DefinedInitialQueryOptionsWithDataTag
---

```ts
type DefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey> = QueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & WithDefinedInitialData<TQueryFnData> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [packages/vue-query/src/queryOptions.ts:214](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L214)

The options returned by the `queryOptions` overload selected when `initialData` is set, with the
`queryKey` tagged with the query's data and error types.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
