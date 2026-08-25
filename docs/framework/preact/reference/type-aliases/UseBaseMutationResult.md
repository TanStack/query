---
id: UseBaseMutationResult
title: UseBaseMutationResult
---

```ts
type UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: [preact-query/src/types.ts:372](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L372)

The result of `useMutation`. Same as MutationObserverResult from `@tanstack/query-core`, with
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

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`
