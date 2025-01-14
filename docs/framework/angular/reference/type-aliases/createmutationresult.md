---
id: CreateMutationResult
title: CreateMutationResult
---

# Type Alias: CreateMutationResult\<TData, TError, TVariables, TContext, TState\>

```ts
type CreateMutationResult<TData, TError, TVariables, TContext, TState> =
  BaseMutationNarrowing<TData, TError, TVariables, TContext> &
    MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TContext** = `unknown`

• **TState** = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](createbasemutationresult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TContext`\>

## Defined in

[types.ts:297](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L297)
