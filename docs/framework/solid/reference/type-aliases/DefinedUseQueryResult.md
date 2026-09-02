---
id: DefinedUseQueryResult
title: DefinedUseQueryResult
---

```ts
type DefinedUseQueryResult<TData, TError> = DefinedUseBaseQueryResult<TData, TError>;
```

Defined in: [types.ts:140](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L140)

The object `useQuery` returns when `initialData` guarantees `data` is never `undefined`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = `DefaultError`

The type of errors this query may hold.
