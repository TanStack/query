---
id: CreateMutationOptions
title: CreateMutationOptions
---

```ts
type CreateMutationOptions<TData, TError, TVariables, TOnMutateResult> = MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/lit-query/src/createMutationController.ts:25](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createMutationController.ts#L25)

Options accepted by `createMutationController`.

This is the Lit adapter shape for `MutationObserverOptions`. Pass it directly
or through an `Accessor` when the options depend on Lit host state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
