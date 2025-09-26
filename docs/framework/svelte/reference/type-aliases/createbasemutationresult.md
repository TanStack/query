---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

# Type Alias: CreateBaseMutationResult\<TData, TError, TVariables, TOnMutateResult\>

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TOnMutateResult> =
  Override<
    MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
    {
      mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
    }
  > &
    object
```

## Type declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<
  TData,
  TError,
  TVariables,
  TOnMutateResult
>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TOnMutateResult** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:114](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L114)
