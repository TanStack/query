---
id: UseSuspenseInfiniteQueryResult
title: UseSuspenseInfiniteQueryResult
---

```ts
type UseSuspenseInfiniteQueryResult<TData, TError> = OmitKeyof<DefinedInfiniteQueryObserverResult<TData, TError>, "isPlaceholderData">;
```

Defined in: [preact-query/src/types.ts:233](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L233)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
