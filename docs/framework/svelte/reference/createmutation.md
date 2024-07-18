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

• **options**: [`StoreOrVal`](storeorval.md)\<[`CreateMutationOptions`](createmutationoptions.md)\<`TData`, `TError`, `TVariables`, `TContext`\>\>

• **queryClient?**: `QueryClient`

## Returns

[`CreateMutationResult`](createmutationresult.md)\<`TData`, `TError`, `TVariables`, `TContext`\>

## Defined in

[packages/svelte-query/src/createMutation.ts:13](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/createMutation.ts#L13)
