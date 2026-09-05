---
id: CreateMutationResult
title: CreateMutationResult
---

```ts
type CreateMutationResult<TData, TError, TVariables, TOnMutateResult, TState> = BaseMutationNarrowing<TData, TError, TVariables, TOnMutateResult> & MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, "safely">>;
```

Defined in: [types.ts:416](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L416)

The result of `injectMutation`. Based on [CreateBaseMutationResult](CreateBaseMutationResult.md), but value fields are exposed as
a `Signal` — read them with `mutation.data()`, not `mutation.data` — while function fields (`mutate`,
`mutateAsync`, `reset`) are called directly, unchanged. `isSuccess`/`isError`/`isPending`/`isIdle` are
[BaseMutationNarrowing](../interfaces/BaseMutationNarrowing.md) type-guard methods rather than plain booleans.

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

### TState

`TState` = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](CreateBaseMutationResult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TOnMutateResult`\>
