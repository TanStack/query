---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

# Type Alias: CreateBaseMutationResult\<TData, TError, TVariables, TContext\>

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TContext> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  {
    mutate: CreateMutateFunction<TData, TError, TVariables, TContext>
  }
> &
  object
```

## Type declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TContext** = `unknown`

## Defined in

[types.ts:188](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L188)
