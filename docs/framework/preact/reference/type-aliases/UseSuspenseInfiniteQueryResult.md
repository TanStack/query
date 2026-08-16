---
id: UseSuspenseInfiniteQueryResult
title: UseSuspenseInfiniteQueryResult
---

# Type Alias: UseSuspenseInfiniteQueryResult\<TData, TError\>

```ts
type UseSuspenseInfiniteQueryResult<TData, TError> = OmitKeyof<DefinedInfiniteQueryObserverResult<TData, TError>, "isPlaceholderData" | "promise">;
```

Defined in: [preact-query/src/types.ts:182](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L182)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
