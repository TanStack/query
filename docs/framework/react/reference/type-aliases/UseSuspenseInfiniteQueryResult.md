---
id: UseSuspenseInfiniteQueryResult
title: UseSuspenseInfiniteQueryResult
---

```ts
type UseSuspenseInfiniteQueryResult<TData, TError> = OmitKeyof<DefinedInfiniteQueryObserverResult<TData, TError>, "isPlaceholderData">;
```

Defined in: [packages/react-query/src/types.ts:389](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L389)

The result of `useSuspenseInfiniteQuery`. Same as [DefinedUseInfiniteQueryResult](DefinedUseInfiniteQueryResult.md), minus
`isPlaceholderData` — Suspense hooks never render placeholder data.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
