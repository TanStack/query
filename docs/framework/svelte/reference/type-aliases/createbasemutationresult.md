---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

# Type Alias: CreateBaseMutationResult\<TData, TError, TVariables, TContext\>

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TContext> = Override<MutationObserverResult<TData, TError, TVariables, TContext>, {
  mutate: CreateMutateFunction<TData, TError, TVariables, TContext>;
 }> & object;
```

## Type declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>;
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TContext** = `unknown`

## Defined in

[packages/svelte-query/src/types.ts:114](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L114)
