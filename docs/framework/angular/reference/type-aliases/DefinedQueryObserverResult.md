---
id: DefinedQueryObserverResult
title: DefinedQueryObserverResult
---

```ts
type DefinedQueryObserverResult<TData, TError> = 
  | QueryObserverRefetchErrorResult<TData, TError>
| QueryObserverSuccessResult<TData, TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:611

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
