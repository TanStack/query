---
id: DefinedUseQueryResult
title: DefinedUseQueryResult
---

```ts
type DefinedUseQueryResult<TData, TError> = DefinedUseBaseQueryResult<TData, TError>;
```

Defined in: [packages/solid-query/src/types.ts:142](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L142)

The object `useQuery` returns when `initialData` guarantees `data` is never `undefined`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors this query may hold.
