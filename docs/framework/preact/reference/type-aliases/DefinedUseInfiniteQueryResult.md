---
id: DefinedUseInfiniteQueryResult
title: DefinedUseInfiniteQueryResult
---

```ts
type DefinedUseInfiniteQueryResult<TData, TError> = DefinedInfiniteQueryObserverResult<TData, TError>;
```

Defined in: [preact-query/src/types.ts:374](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L374)

The result of `useInfiniteQuery` when `initialData` is set — `data` is never `undefined`. Re-exports
DefinedInfiniteQueryObserverResult from `@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.
