---
id: UseSuspenseQueryResult
title: UseSuspenseQueryResult
---

```ts
type UseSuspenseQueryResult<TData, TError> = DistributiveOmit<DefinedQueryObserverResult<TData, TError>, "isPlaceholderData">;
```

Defined in: [preact-query/src/types.ts:274](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L274)

The result of `useSuspenseQuery`. Same as [DefinedUseQueryResult](DefinedUseQueryResult.md), minus `isPlaceholderData` — always
`false` on that type, so this drops the dead field rather than an active state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
