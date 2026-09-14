---
id: UseBaseQueryResult
title: UseBaseQueryResult
---

```ts
type UseBaseQueryResult<TData, TError> = QueryObserverResult<TData, TError>;
```

Defined in: [packages/preact-query/src/types.ts:313](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L313)

The result of `useQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
`pending`. Re-exports [QueryObserverResult](QueryObserverResult.md) from `@tanstack/query-core`. `useInfiniteQuery` returns
[UseInfiniteQueryResult](UseInfiniteQueryResult.md) instead.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
