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

Defined in: [packages/query-core/src/types.ts:1188](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1188)

The result of a `QueryObserver`, and of the hooks built on it like `useQuery`. Narrow it by
`status` or the `is*` flags to get the type of each state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
