---
id: UseSuspenseInfiniteQueryResult
title: UseSuspenseInfiniteQueryResult
---

# Type Alias: UseSuspenseInfiniteQueryResult\<TData, TError\>

```ts
type UseSuspenseInfiniteQueryResult<TData, TError> = OmitKeyof<DefinedInfiniteQueryObserverResult<TData, TError>, "isPlaceholderData" | "promise">;
```

Defined in: [preact-query/src/types.ts:183](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/types.ts#L183)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
