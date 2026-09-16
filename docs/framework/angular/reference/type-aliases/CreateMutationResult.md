---
id: CreateMutationResult
title: CreateMutationResult
---

```ts
type CreateMutationResult<TData, TError, TVariables, TOnMutateResult, TState> = BaseMutationNarrowing<TData, TError, TVariables, TOnMutateResult> & MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, "safely">, MethodKeys<OmitKeyof<TState, keyof BaseMutationNarrowing, "safely">>>;
```

Defined in: [packages/angular-query/src/types.ts:373](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L373)

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

### TState

`TState` = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](CreateBaseMutationResult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TOnMutateResult`\>
