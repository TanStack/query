---
id: UseBaseQueryResult
title: UseBaseQueryResult
---

```ts
type UseBaseQueryResult<TData, TError> = QueryObserverResult<TData, TError>;
```

Defined in: [types.ts:106](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L106)

The object `useQuery`'s shared base returns — `data`/`error` may still be `undefined`/`null` while the
query is `pending`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = `DefaultError`

The type of errors this query may hold.
