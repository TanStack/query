---
id: DefinedUseInfiniteQueryResult
title: DefinedUseInfiniteQueryResult
---

```ts
type DefinedUseInfiniteQueryResult<TData, TError> = DefinedInfiniteQueryObserverResult<TData, TError>;
```

Defined in: [packages/react-query/src/types.ts:377](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L377)

The result of `useInfiniteQuery` when `initialData` is set — `data` is never `undefined`. Re-exports
[DefinedInfiniteQueryObserverResult](DefinedInfiniteQueryObserverResult.md) from `@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
