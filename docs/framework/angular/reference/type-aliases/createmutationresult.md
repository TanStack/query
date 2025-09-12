---
id: CreateMutationResult
title: CreateMutationResult
---

# Type Alias: CreateMutationResult\<TData, TError, TVariables, TOnMutateResult, TState\>

```ts
type CreateMutationResult<TData, TError, TVariables, TOnMutateResult, TState> =
  BaseMutationNarrowing<TData, TError, TVariables, TOnMutateResult> &
    MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TOnMutateResult** = `unknown`

• **TState** = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](../createbasemutationresult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Defined in

[types.ts:298](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L298)
