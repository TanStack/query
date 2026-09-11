---
id: UseBaseMutationResult
title: UseBaseMutationResult
---

```ts
type UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: [packages/react-query/src/types.ts:471](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L471)

The result of `useMutation`. Same as [MutationObserverResult](MutationObserverResult.md) from `@tanstack/query-core`, with
`mutate` narrowed to the fire-and-forget [UseMutateFunction](UseMutateFunction.md) signature, plus the added `mutateAsync`.

## Type Declaration

### mutateAsync

```ts
mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>;
```

Similar to `mutate`, but returns a promise which can be awaited.

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `unknown`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.
