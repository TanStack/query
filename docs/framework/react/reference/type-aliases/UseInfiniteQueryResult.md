---
id: UseInfiniteQueryResult
title: UseInfiniteQueryResult
---

```ts
type UseInfiniteQueryResult<TData, TError> = InfiniteQueryObserverResult<TData, TError>;
```

Defined in: [packages/react-query/src/types.ts:365](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L365)

The result of `useInfiniteQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
`pending`. Re-exports [InfiniteQueryObserverResult](InfiniteQueryObserverResult.md) from `@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
