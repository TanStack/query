---
id: QueryBooleanOption
title: QueryBooleanOption
---

```ts
type QueryBooleanOption<TQueryFnData, TError, TData, TQueryKey> = boolean | (query) => boolean;
```

Defined in: [packages/query-core/src/types.ts:119](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L119)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
