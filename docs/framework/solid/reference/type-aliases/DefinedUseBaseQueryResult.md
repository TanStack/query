---
id: DefinedUseBaseQueryResult
title: DefinedUseBaseQueryResult
---

```ts
type DefinedUseBaseQueryResult<TData, TError> = DefinedQueryObserverResult<TData, TError>;
```

Defined in: [packages/solid-query/src/types.ts:131](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L131)

The object `useQuery` returns when `initialData` guarantees `data` is never `undefined`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors this query may hold.
