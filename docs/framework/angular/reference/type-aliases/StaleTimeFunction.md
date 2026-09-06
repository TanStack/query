---
id: StaleTimeFunction
title: StaleTimeFunction
---

```ts
type StaleTimeFunction<TQueryFnData, TError, TData, TQueryKey> = StaleTime | (query) => StaleTime;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:44

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
