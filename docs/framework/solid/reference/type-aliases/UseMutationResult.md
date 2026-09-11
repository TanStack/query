---
id: UseMutationResult
title: UseMutationResult
---

```ts
type UseMutationResult<TData, TError, TVariables, TOnMutateResult> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/solid-query/src/types.ts:334](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L334)

The result of `useMutation`. Same as [UseBaseMutationResult](UseBaseMutationResult.md).

## Type Parameters

### TData

`TData` = `unknown`

The type your `mutationFn` resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `mutationFn` may throw.

### TVariables

`TVariables` = `unknown`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.
