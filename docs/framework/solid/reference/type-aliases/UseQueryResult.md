---
id: UseQueryResult
title: UseQueryResult
---

```ts
type UseQueryResult<TData, TError> = UseBaseQueryResult<TData, TError>;
```

Defined in: [types.ts:118](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L118)

The object `useQuery` returns — `data`/`error` may still be `undefined`/`null` while the query is
`pending`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = `DefaultError`

The type of errors this query may hold.
