---
id: DefinedQueryObserverResult
title: DefinedQueryObserverResult
---

```ts
type DefinedQueryObserverResult<TData, TError> = 
  | QueryObserverRefetchErrorResult<TData, TError>
| QueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:966](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L966)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
