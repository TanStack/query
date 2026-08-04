---
id: UseSuspenseInfiniteQueryResult
title: UseSuspenseInfiniteQueryResult
---

# Type Alias: UseSuspenseInfiniteQueryResult\<TData, TError\>

```ts
type UseSuspenseInfiniteQueryResult<TData, TError> = OmitKeyof<DefinedInfiniteQueryObserverResult<TData, TError>, "isPlaceholderData" | "promise">;
```

Defined in: packages/octane-query/src/types.ts:188

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
