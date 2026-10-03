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

Defined in: [packages/query-core/src/types.ts:1382](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1382)

The result of an `InfiniteQueryObserver`, and of the hooks built on it like `useInfiniteQuery`.
Narrow it by `status` or the `is*` flags to get the type of each state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
