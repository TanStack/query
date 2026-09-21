---
id: UseMutateAsyncFunction
title: UseMutateAsyncFunction
---

```ts
type UseMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> = MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/preact-query/src/types.ts:453](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L453)

The type of `mutateAsync`, as returned by `useMutation`. Similar to [UseMutateFunction](UseMutateFunction.md), but returns a
promise which can be awaited.

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.
