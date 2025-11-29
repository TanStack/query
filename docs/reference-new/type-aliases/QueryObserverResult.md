---
id: QueryObserverResult
title: QueryObserverResult
---

# Type Alias: QueryObserverResult\<TData, TError\>

```ts
type QueryObserverResult<TData, TError> = 
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverLoadingErrorResult<TData, TError>
  | QueryObserverLoadingResult<TData, TError>
  | QueryObserverPendingResult<TData, TError>
| QueryObserverPlaceholderResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:899](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L899)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
