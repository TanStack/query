---
id: CreateMutationOptions
title: CreateMutationOptions
---

# Type Alias: CreateMutationOptions\<TData, TError, TVariables, TOnMutateResult\>

```ts
type CreateMutationOptions<TData, TError, TVariables, TOnMutateResult> =
  OmitKeyof<
    MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
    '_defaulted'
  >
```

Options for createMutation

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `void`

• **TOnMutateResult** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:88](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L88)
