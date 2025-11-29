---
id: DefinedInfiniteQueryObserverResult
title: DefinedInfiniteQueryObserverResult
---

# Type Alias: DefinedInfiniteQueryObserverResult\<TData, TError\>

```ts
type DefinedInfiniteQueryObserverResult<TData, TError> = 
  | InfiniteQueryObserverRefetchErrorResult<TData, TError>
| InfiniteQueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:1053](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1053)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
