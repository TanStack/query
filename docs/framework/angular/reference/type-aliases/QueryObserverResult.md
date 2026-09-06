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

Defined in: packages/query-core/dist-ts/src/types.d.ts:591

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
