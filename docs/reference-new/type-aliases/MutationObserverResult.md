---
id: MutationObserverResult
title: MutationObserverResult
---

# Type Alias: MutationObserverResult\<TData, TError, TVariables, TOnMutateResult\>

```ts
type MutationObserverResult<TData, TError, TVariables, TOnMutateResult> = 
  | MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>
| MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/types.ts:1340](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1340)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
