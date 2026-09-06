---
id: DefinedInfiniteQueryObserverResult
title: DefinedInfiniteQueryObserverResult
---

```ts
type DefinedInfiniteQueryObserverResult<TData, TError> = 
  | InfiniteQueryObserverRefetchErrorResult<TData, TError>
| InfiniteQueryObserverSuccessResult<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:707

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
