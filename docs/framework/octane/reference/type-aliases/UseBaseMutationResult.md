---
id: UseBaseMutationResult
title: UseBaseMutationResult
---

# Type Alias: UseBaseMutationResult\<TData, TError, TVariables, TOnMutateResult\>

```ts
type UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: packages/octane-query/src/types.ts:225

## Type Declaration

### mutateAsync

```ts
mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>;
```

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`
