---
id: MutationTypeFromResult
title: MutationTypeFromResult
---

```ts
type MutationTypeFromResult<TResult> = [TResult] extends [MutationState<infer TData, infer TError, infer TVariables, infer TOnMutateResult>] ? Mutation<TData, TError, TVariables, TOnMutateResult> : Mutation;
```

Defined in: [packages/svelte-query/src/types.ts:146](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L146)

## Type Parameters

### TResult

`TResult`
