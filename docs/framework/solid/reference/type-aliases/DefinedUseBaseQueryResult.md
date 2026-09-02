---
id: DefinedUseBaseQueryResult
title: DefinedUseBaseQueryResult
---

```ts
type DefinedUseBaseQueryResult<TData, TError> = DefinedQueryObserverResult<TData, TError>;
```

Defined in: [types.ts:129](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L129)

The object `useQuery`'s shared base returns when `initialData` guarantees `data` is never `undefined`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = `DefaultError`

The type of errors this query may hold.
