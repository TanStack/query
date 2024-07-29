---
id: CreateMutationResult
title: CreateMutationResult
---

# Type Alias: CreateMutationResult\<TData, TError, TVariables, TContext, TState\>

```ts
type CreateMutationResult<TData, TError, TVariables, TContext, TState>: BaseMutationNarrowing<TData, TError, TVariables, TContext> & MapToSignals<OmitKeyof<TState, keyof BaseMutationNarrowing, "safely">>;
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TContext** = `unknown`

• **TState** = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](createbasemutationresult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TContext`\>

## Defined in

[types.ts:292](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/types.ts#L292)
