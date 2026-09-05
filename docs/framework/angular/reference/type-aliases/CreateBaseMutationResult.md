---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: [types.ts:284](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L284)

The pre-`Signal` shape [CreateMutationResult](CreateMutationResult.md) is built from — not what `injectMutation` actually
returns. Same as MutationObserverResult from `@tanstack/query-core`, with `mutate` narrowed to the
fire-and-forget [CreateMutateFunction](CreateMutateFunction.md) signature, plus the added `mutateAsync`.

## Type Declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>;
```

Similar to `mutate`, but returns a promise which can be awaited.

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = `DefaultError`

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `unknown`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.
