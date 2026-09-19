---
id: StaleTimeFunction
title: StaleTimeFunction
---

```ts
type StaleTimeFunction<TQueryFnData, TError, TData, TQueryKey> =
  | number | "static"
  | (query: Query<TQueryFnData, TError, TData, TQueryKey>) => number | "static";
```

Defined in: [packages/query-core/src/types.ts:140](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L140)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
