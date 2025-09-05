---
id: CreateMutationOptions
title: CreateMutationOptions
---

# Type Alias: CreateMutationOptions\<TData, TError, TVariables, TScope\>

```ts
type CreateMutationOptions<TData, TError, TVariables, TScope> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TScope>,
  '_defaulted'
>
```

Options for createMutation

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `void`

• **TScope** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:88](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L88)
