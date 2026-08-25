---
id: DefinedUseQueryResult
title: DefinedUseQueryResult
---

```ts
type DefinedUseQueryResult<TData, TError> = DefinedQueryObserverResult<TData, TError>;
```

Defined in: [preact-query/src/types.ts:350](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L350)

The result of `useQuery` when `initialData` is set, or of `useSuspenseQuery` before the `isPlaceholderData`
omission — `data` is never `undefined`. Re-exports DefinedQueryObserverResult from
`@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.
