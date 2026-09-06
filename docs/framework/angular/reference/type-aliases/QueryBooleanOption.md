---
id: QueryBooleanOption
title: QueryBooleanOption
---

```ts
type QueryBooleanOption<TQueryFnData, TError, TData, TQueryKey> = boolean | (query) => boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:45

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
