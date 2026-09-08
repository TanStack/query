---
id: UseMutationOptions
title: UseMutationOptions
---

```ts
type UseMutationOptions<TData, TError, TVariables, TOnMutateResult> = 
  | MaybeRefDeep<MutationOptions<TData, TError, TVariables, TOnMutateResult>>
| () => MaybeRefDeep<MutationOptions<TData, TError, TVariables, TOnMutateResult>>;
```

Defined in: [packages/vue-query/src/useMutation.ts:31](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L31)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
