---
id: CreateMutationOptions
title: CreateMutationOptions
---

# Type Alias: CreateMutationOptions\<TData, TError, TVariables, TOnMutateResult\>

```ts
type CreateMutationOptions<TData, TError, TVariables, TOnMutateResult> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>, "_defaulted">;
```

Defined in: [packages/svelte-query/src/types.ts:86](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L86)

Options for createMutation

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
