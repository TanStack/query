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

Defined in: packages/query-core/dist-ts/src/types.d.ts:1015

The result of a `QueryObserver`, and of the hooks built on it like `useQuery`. Narrow it by
`status` or the `is*` flags to get the type of each state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
