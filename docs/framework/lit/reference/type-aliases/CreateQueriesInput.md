---
id: CreateQueriesInput
title: CreateQueriesInput
---

# Type Alias: CreateQueriesInput\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type CreateQueriesInput<TQueryFnData, TError, TData, TQueryKey> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:30](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L30)

Options for one query inside `createQueriesController`.

This mirrors `QueryObserverOptions` and is used by the tuple inference that
maps each input query to its corresponding result.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
