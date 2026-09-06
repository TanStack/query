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

Defined in: packages/query-core/dist-ts/src/types.d.ts:695

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
