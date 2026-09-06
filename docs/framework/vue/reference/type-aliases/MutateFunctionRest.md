---
id: MutateFunctionRest
title: MutateFunctionRest
---

```ts
type MutateFunctionRest<TData, TError, TVariables, TOnMutateResult> = undefined extends TVariables ? [TVariables, MutateOptions<TData, TError, TVariables, TOnMutateResult>] : [TVariables, MutateOptions<TData, TError, TVariables, TOnMutateResult>];
```

Defined in: [packages/query-core/src/types.ts:1256](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1256)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
