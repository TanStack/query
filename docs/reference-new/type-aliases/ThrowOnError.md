---
id: ThrowOnError
title: ThrowOnError
---

# Type Alias: ThrowOnError\<TQueryFnData, TError, TQueryData, TQueryKey\>

```ts
type ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey> = boolean | (error, query) => boolean;
```

Defined in: [packages/query-core/src/types.ts:300](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L300)

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError`

### TQueryData

`TQueryData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md)
