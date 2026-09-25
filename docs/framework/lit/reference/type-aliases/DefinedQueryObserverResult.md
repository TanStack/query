---
id: DefinedQueryObserverResult
title: DefinedQueryObserverResult
---

```ts
type DefinedQueryObserverResult<TData, TError> =
  | QueryObserverRefetchErrorResult<TData, TError>
| QueryObserverSuccessResult<TData, TError>;
```

Defined in: [packages/query-core/src/types.ts:1049](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1049)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)
