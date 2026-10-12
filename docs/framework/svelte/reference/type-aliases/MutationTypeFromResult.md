---
id: MutationTypeFromResult
title: MutationTypeFromResult
---

```ts
type MutationTypeFromResult<TResult> = [TResult] extends [MutationState<infer TData, infer TError, infer TVariables, infer TOnMutateResult>] ? Mutation<TData, TError, TVariables, TOnMutateResult> : Mutation;
```

Defined in: [packages/svelte-query/src/types.ts:168](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L168)

Infers the `Mutation` type passed to `useMutationState`'s `select` from the `MutationState` type it
returns, falling back to `Mutation` otherwise.

## Type Parameters

### TResult

`TResult`
