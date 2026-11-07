---
id: CoreQueryOptions
title: CoreQueryOptions
---

```ts
type CoreQueryOptions<TQueryFnData, TError, TData, TQueryKey> =
  | DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  | UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
| UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>;
```

Defined in: [packages/query-core/src/queryOptions.ts:79](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryOptions.ts#L79)

Framework-agnostic options accepted by `queryOptions`.

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
