---
id: CreateMutationOptions
title: CreateMutationOptions
---

# Type Alias: CreateMutationOptions\<TData, TError, TVariables, TContext\>

```ts
type CreateMutationOptions<TData, TError, TVariables, TContext> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TContext>, "_defaulted">;
```

Options for createMutation

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `void`

• **TContext** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:88](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L88)
