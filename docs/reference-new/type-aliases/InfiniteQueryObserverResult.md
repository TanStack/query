---
id: InfiniteQueryObserverResult
title: InfiniteQueryObserverResult
---

# Type Alias: InfiniteQueryObserverResult\<TData, TError\>

```ts
type InfiniteQueryObserverResult<TData, TError> = 
  | DefinedInfiniteQueryObserverResult<TData, TError>
  | InfiniteQueryObserverLoadingErrorResult<TData, TError>
  | InfiniteQueryObserverLoadingResult<TData, TError>
  | InfiniteQueryObserverPendingResult<TData, TError>
| InfiniteQueryObserverPlaceholderResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:1060](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1060)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
