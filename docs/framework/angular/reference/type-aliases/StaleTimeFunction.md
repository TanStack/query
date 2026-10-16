---
id: StaleTimeFunction
title: StaleTimeFunction
---

```ts
type StaleTimeFunction<TQueryFnData, TError, TData, TQueryKey> =
  | number | "static"
  | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => number | "static");
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:128

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
