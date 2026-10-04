---
id: DefinedQueryObserverResult
title: DefinedQueryObserverResult
---

```ts
type DefinedQueryObserverResult<TData, TError> =
  | QueryObserverRefetchErrorResult<TData, TError>
| QueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:1390](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1390)

A query result that always has `data`: the success and refetch error states.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
