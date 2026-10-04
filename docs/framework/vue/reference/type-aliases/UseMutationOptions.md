---
id: UseMutationOptions
title: UseMutationOptions
---

```ts
type UseMutationOptions<TData, TError, TVariables, TOnMutateResult> = 
  | MaybeRefDeep<MutationOptions<TData, TError, TVariables, TOnMutateResult>>
| () => MaybeRefDeep<MutationOptions<TData, TError, TVariables, TOnMutateResult>>;
```

Defined in: [packages/vue-query/src/useMutation.ts:35](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L35)

The options accepted by `useMutation`: [MutationOptions](MutationOptions.md) as a plain object, a `ref`, or a reactive
getter.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
