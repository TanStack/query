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

• **TState** = `CreateStatusBasedMutationResult`\<[`CreateBaseMutationResult`](CreateBaseMutationResult.md)\[`"status"`\], `TData`, `TError`, `TVariables`, `TContext`\>

## Defined in

[types.ts:292](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L292)
