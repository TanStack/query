---
id: MutateFunctionRest
title: MutateFunctionRest
---

```ts
type MutateFunctionRest<TData, TError, TVariables, TOnMutateResult> = undefined extends TVariables ? [TVariables, MutateOptions<TData, TError, TVariables, TOnMutateResult>] : [TVariables, MutateOptions<TData, TError, TVariables, TOnMutateResult>];
```

Defined in: [packages/query-core/src/types.ts:2047](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L2047)

The parameters of [MutateFunction](MutateFunction.md): `variables`, optional when `TVariables` accepts
`undefined`, and the [MutateOptions](../interfaces/MutateOptions.md) for that call.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
