---
id: ThrowOnError
title: ThrowOnError
---

```ts
type ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey> = 
  | boolean
  | (error: TError, query: Query<TQueryFnData, TError, TQueryData, TQueryKey>) => boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:209

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError`

### TQueryData

`TQueryData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md)
