---
id: InfiniteQueryObserverResult
title: InfiniteQueryObserverResult
---

```ts
type InfiniteQueryObserverResult<TData, TError> =
  | DefinedInfiniteQueryObserverResult<TData, TError>
  | InfiniteQueryObserverLoadingErrorResult<TData, TError>
  | InfiniteQueryObserverLoadingResult<TData, TError>
  | InfiniteQueryObserverPendingResult<TData, TError>
| InfiniteQueryObserverPlaceholderResult<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:1374

The result of an `InfiniteQueryObserver`, and of the hooks built on it like `useInfiniteQuery`.
Narrow it by `status` or the `is*` flags to get the type of each state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
