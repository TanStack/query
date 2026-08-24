---
id: UseBaseMutationResult
title: UseBaseMutationResult
---

```ts
type UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: [preact-query/src/types.ts:256](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L256)

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
