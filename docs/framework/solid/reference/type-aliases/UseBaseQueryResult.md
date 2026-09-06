---
id: UseBaseQueryResult
title: UseBaseQueryResult
---

```ts
type UseBaseQueryResult<TData, TError> = QueryObserverResult<TData, TError>;
```

Defined in: [packages/solid-query/src/types.ts:108](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L108)

The object `useQuery` returns when `initialData` isn't set — `data`/`error` may still be `undefined`/`null`
while the query is `pending`. Re-exports [QueryObserverResult](QueryObserverResult.md) from `@tanstack/query-core`.
`useInfiniteQuery` returns [UseInfiniteQueryResult](UseInfiniteQueryResult.md) instead.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors this query may hold.
