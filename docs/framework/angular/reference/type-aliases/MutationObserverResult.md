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

Defined in: packages/query-core/dist-ts/src/types.d.ts:856

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
