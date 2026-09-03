---
id: DefinedUseInfiniteQueryResult
title: DefinedUseInfiniteQueryResult
---

```ts
type DefinedUseInfiniteQueryResult<TData, TError> = DefinedInfiniteQueryObserverResult<TData, TError>;
```

Defined in: [types.ts:227](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L227)

The object `useInfiniteQuery` returns when `initialData` guarantees `data` is never `undefined`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = `DefaultError`

The type of errors this query may hold.
