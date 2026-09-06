---
id: MutateFunctionRest
title: MutateFunctionRest
---

```ts
type MutateFunctionRest<TData, TError, TVariables, TOnMutateResult> = undefined extends TVariables ? [TVariables, MutateOptions<TData, TError, TVariables, TOnMutateResult>] : [TVariables, MutateOptions<TData, TError, TVariables, TOnMutateResult>];
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:736

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
