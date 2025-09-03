---
id: CreateMutationResult
title: CreateMutationResult
---

# Type Alias: CreateMutationResult\<TData, TError, TVariables, TScope, TState\>

```ts
type CreateMutationResult<TData, TError, TVariables, TScope, TState> =
  BaseMutationNarrowing<TData, TError, TVariables, TScope> &
    MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, 'safely'>>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TScope** = `unknown`

• **TState** = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](../createbasemutationresult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TScope`\>

## Defined in

[types.ts:298](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L298)
