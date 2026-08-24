---
id: UseSuspenseQueryResult
title: UseSuspenseQueryResult
---

```ts
type UseSuspenseQueryResult<TData, TError> = DistributiveOmit<DefinedQueryObserverResult<TData, TError>, "isPlaceholderData">;
```

Defined in: [preact-query/src/types.ts:210](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L210)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
