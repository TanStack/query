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

Defined in: [preact-query/src/types.ts:220](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/types.ts#L220)

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
