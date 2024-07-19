---
id: createMutation
title: createMutation
---

# Function: createMutation()

```ts
function createMutation<TData, TError, TVariables, TContext>(options, queryClient?): CreateMutationResult<TData, TError, TVariables, TContext>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TContext** = `unknown`

## Parameters

• **options**: [`StoreOrVal`](StoreOrVal.md)\<[`CreateMutationOptions`](CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TContext`\>\>

• **queryClient?**: `QueryClient`

## Returns

[`CreateMutationResult`](CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`\>

## Defined in

[packages/svelte-query/src/createMutation.ts:13](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/createMutation.ts#L13)
