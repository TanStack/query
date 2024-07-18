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

[packages/svelte-query/src/types.ts:97](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/types.ts#L97)
