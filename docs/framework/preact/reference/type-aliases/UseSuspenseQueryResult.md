---
id: UseSuspenseQueryResult
title: UseSuspenseQueryResult
---

```ts
type UseSuspenseQueryResult<TData, TError> = DistributiveOmit<DefinedQueryObserverResult<TData, TError>, "isPlaceholderData" | "promise">;
```

Defined in: [preact-query/src/types.ts:159](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L159)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
