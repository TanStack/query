---
id: QueryObserverResult
title: QueryObserverResult
---

```ts
type QueryObserverResult<TData, TError> = 
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverLoadingErrorResult<TData, TError>
  | QueryObserverLoadingResult<TData, TError>
  | QueryObserverPendingResult<TData, TError>
| QueryObserverPlaceholderResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:994](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L994)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
