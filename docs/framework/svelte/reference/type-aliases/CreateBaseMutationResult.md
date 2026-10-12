---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult> = Override<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, {
  mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>;
}> & object;
```

Defined in: [packages/svelte-query/src/types.ts:139](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L139)

The result of `createMutation`. Same as [MutationObserverResult](MutationObserverResult.md) from `@tanstack/query-core`, with
`mutate` narrowed to the fire-and-forget [CreateMutateFunction](CreateMutateFunction.md) signature, plus the added
`mutateAsync`.

## Type Declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult>;
```

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`
