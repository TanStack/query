---
id: DefinedInitialQueryOptionsWithDataTag
title: DefinedInitialQueryOptionsWithDataTag
---

```ts
type DefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey> = DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [vue-query/src/queryOptions.ts:131](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L131)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
