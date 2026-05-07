---
id: MutationControllerOptions
title: MutationControllerOptions
---

# Type Alias: MutationControllerOptions\<TData, TError, TVariables, TOnMutateResult\>

```ts
type MutationControllerOptions<TData, TError, TVariables, TOnMutateResult> = Accessor<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>>;
```

Defined in: [packages/lit-query/src/types.ts:54](https://github.com/TanStack/query/blob/main/packages/lit-query/src/types.ts#L54)

Accessor-wrapped options accepted by `createMutationController`.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
