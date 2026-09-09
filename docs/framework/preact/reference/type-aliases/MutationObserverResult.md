---
id: MutationObserverResult
title: MutationObserverResult
---

```ts
type MutationObserverResult<TData, TError, TVariables, TOnMutateResult> = 
  | MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>
| MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/types.ts:1484](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1484)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
