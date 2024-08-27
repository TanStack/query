---
id: CreateMutateFunction
title: CreateMutateFunction
---

# Type Alias: CreateMutateFunction()\<TData, TError, TVariables, TContext\>

```ts
type CreateMutateFunction<TData, TError, TVariables, TContext>: (...args) => void;
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `void`

• **TContext** = `unknown`

## Parameters

• ...**args**: `Parameters`\<`MutateFunction`\<`TData`, `TError`, `TVariables`, `TContext`\>\>

## Returns

`void`

## Defined in

[packages/svelte-query/src/types.ts:97](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/types.ts#L97)
