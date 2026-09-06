---
id: UseInfiniteQueryResult
title: UseInfiniteQueryResult
---

```ts
type UseInfiniteQueryResult<TData, TError> = InfiniteQueryObserverResult<TData, TError>;
```

Defined in: [packages/solid-query/src/types.ts:216](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L216)

The object `useInfiniteQuery` returns — `data`/`error` may still be `undefined`/`null` while the query is
`pending`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as, after `select` runs (if set).

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors this query may hold.
