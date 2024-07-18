---
id: CreateBaseMutationResult
title: CreateBaseMutationResult
---

# Type Alias: CreateBaseMutationResult\<TData, TError, TVariables, TContext\>

```ts
type CreateBaseMutationResult<TData, TError, TVariables, TContext>: Override<MutationObserverResult<TData, TError, TVariables, TContext>, object> & object;
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

[packages/svelte-query/src/types.ts:113](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/types.ts#L113)
