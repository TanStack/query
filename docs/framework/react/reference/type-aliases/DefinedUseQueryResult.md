---
id: DefinedUseQueryResult
title: DefinedUseQueryResult
---

```ts
type DefinedUseQueryResult<TData, TError> = DefinedQueryObserverResult<TData, TError>;
```

Defined in: [packages/react-query/src/types.ts:353](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L353)

The result of `useQuery` when `initialData` is set, or of `useSuspenseQuery` before the `isPlaceholderData`
omission — `data` is never `undefined`. Re-exports [DefinedQueryObserverResult](DefinedQueryObserverResult.md) from
`@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
