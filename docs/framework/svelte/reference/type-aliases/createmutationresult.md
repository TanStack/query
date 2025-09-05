---
id: CreateMutationResult
title: CreateMutationResult
---

# Type Alias: CreateMutationResult\<TData, TError, TVariables, TScope\>

```ts
type CreateMutationResult<TData, TError, TVariables, TScope> = Readable<
  CreateBaseMutationResult<TData, TError, TVariables, TScope>
>
```

Result from createMutation

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TScope** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:127](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L127)
