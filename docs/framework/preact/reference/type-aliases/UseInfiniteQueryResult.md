---
id: UseInfiniteQueryResult
title: UseInfiniteQueryResult
---

```ts
type UseInfiniteQueryResult<TData, TError> = InfiniteQueryObserverResult<TData, TError>;
```

Defined in: [preact-query/src/types.ts:297](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L297)

The result of `useInfiniteQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
`pending`. Re-exports InfiniteQueryObserverResult from `@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
