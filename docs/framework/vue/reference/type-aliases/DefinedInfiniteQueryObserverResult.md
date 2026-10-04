---
id: DefinedInfiniteQueryObserverResult
title: DefinedInfiniteQueryObserverResult
---

```ts
type DefinedInfiniteQueryObserverResult<TData, TError> = 
  | InfiniteQueryObserverRefetchErrorResult<TData, TError>
| InfiniteQueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:1790](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1790)

An infinite query result that always has `data`: the success and refetch error states.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
