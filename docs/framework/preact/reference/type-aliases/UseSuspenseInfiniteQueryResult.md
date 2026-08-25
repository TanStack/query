---
id: UseSuspenseInfiniteQueryResult
title: UseSuspenseInfiniteQueryResult
---

```ts
type UseSuspenseInfiniteQueryResult<TData, TError> = OmitKeyof<DefinedInfiniteQueryObserverResult<TData, TError>, "isPlaceholderData">;
```

Defined in: [preact-query/src/types.ts:386](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L386)

The result of `useSuspenseInfiniteQuery`. Same as [DefinedUseInfiniteQueryResult](DefinedUseInfiniteQueryResult.md), minus
`isPlaceholderData` — Suspense hooks never render placeholder data.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.
