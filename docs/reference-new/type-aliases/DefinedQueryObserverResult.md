---
id: DefinedQueryObserverResult
title: DefinedQueryObserverResult
---

# Type Alias: DefinedQueryObserverResult\<TData, TError\>

```ts
type DefinedQueryObserverResult<TData, TError> = 
  | QueryObserverRefetchErrorResult<TData, TError>
| QueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:892](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L892)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
