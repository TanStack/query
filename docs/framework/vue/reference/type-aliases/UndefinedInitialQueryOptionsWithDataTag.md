---
id: UndefinedInitialQueryOptionsWithDataTag
title: UndefinedInitialQueryOptionsWithDataTag
---

```ts
type UndefinedInitialQueryOptionsWithDataTag<TQueryFnData, TError, TData, TQueryKey> = UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [vue-query/src/queryOptions.ts:117](https://github.com/TanStack/query/blob/main/packages/vue-query/src/queryOptions.ts#L117)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
