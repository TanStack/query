---
id: UseSuspenseQueryResult
title: UseSuspenseQueryResult
---

# Type Alias: UseSuspenseQueryResult\<TData, TError\>

```ts
type UseSuspenseQueryResult<TData, TError> = DistributiveOmit<DefinedQueryObserverResult<TData, TError>, "isPlaceholderData" | "promise">;
```

Defined in: packages/octane-query/src/types.ts:165

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
