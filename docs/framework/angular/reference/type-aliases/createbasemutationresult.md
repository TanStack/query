---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

# Type Alias: CreateBaseMutationResult\<TData, TError, TVariables, TScope\>

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TScope> = Override<
  MutationObserverResult<TData, TError, TVariables, TScope>,
  {
    mutate: CreateMutateFunction<TData, TError, TVariables, TScope>
  }
> &
  object
```

## Type declaration

### mutateAsync

```ts
mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TScope>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TScope** = `unknown`

## Defined in

[types.ts:188](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L188)
