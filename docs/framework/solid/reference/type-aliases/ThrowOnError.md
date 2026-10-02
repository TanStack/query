---
id: ThrowOnError
title: ThrowOnError
---

```ts
type ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey> = 
  | boolean
  | (error: TError, query: Query<TQueryFnData, TError, TQueryData, TQueryKey>) => boolean;
```

Defined in: [packages/query-core/src/types.ts:420](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L420)

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError`

### TQueryData

`TQueryData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md)
