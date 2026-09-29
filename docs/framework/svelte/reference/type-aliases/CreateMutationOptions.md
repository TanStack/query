---
id: CreateMutationOptions
title: CreateMutationOptions
---

```ts
type CreateMutationOptions<TData, TError, TVariables, TOnMutateResult> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>, "_defaulted">;
```

Defined in: [packages/svelte-query/src/types.ts:93](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L93)

Options for createMutation

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
