---
id: createMutation
title: createMutation
---

# Function: createMutation()

```ts
function createMutation<TData, TError, TVariables, TContext>(
  options,
  queryClient?,
): CreateMutationResult<TData, TError, TVariables, TContext>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TContext** = `unknown`

## Parameters

• **options**: [`StoreOrVal`](../type-aliases/storeorval.md)\<[`CreateMutationOptions`](../type-aliases/createmutationoptions.md)\<`TData`, `TError`, `TVariables`, `TContext`\>\>

• **queryClient?**: `QueryClient`

## Returns

[`CreateMutationResult`](../type-aliases/createmutationresult.md)\<`TData`, `TError`, `TVariables`, `TContext`\>

## Defined in

[packages/svelte-query/src/createMutation.ts:13](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/createMutation.ts#L13)
