---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

# Type Alias: CreateBaseMutationResult\<TData, TError, TVariables, TOnMutateResult\>

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: [types.ts:160](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L160)

## Type Declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>;
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
