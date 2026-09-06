---
id: DefinedInfiniteQueryObserverResult
title: DefinedInfiniteQueryObserverResult
---

```ts
type DefinedInfiniteQueryObserverResult<TData, TError> = 
  | InfiniteQueryObserverRefetchErrorResult<TData, TError>
| InfiniteQueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:1114](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1114)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
