---
id: UseSuspenseQueryResult
title: UseSuspenseQueryResult
---

```ts
type UseSuspenseQueryResult<TData, TError> = DistributiveOmit<DefinedQueryObserverResult<TData, TError>, "isPlaceholderData">;
```

Defined in: [preact-query/src/types.ts:334](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L334)

The result of `useSuspenseQuery`. Same as [DefinedUseQueryResult](DefinedUseQueryResult.md), minus `isPlaceholderData` — always
`false` on that type, so this drops the dead field rather than an active state.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.
