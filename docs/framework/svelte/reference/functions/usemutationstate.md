---
id: useMutationState
title: useMutationState
---

# Function: useMutationState()

```ts
function useMutationState<TResult>(options, queryClient?): Readable<TResult[]>
```

## Type Parameters

• **TResult** = `MutationState`\<`unknown`, `Error`, `unknown`, `unknown`\>

## Parameters

• **options**: [`MutationStateOptions`](../type-aliases/mutationstateoptions.md)\<`TResult`\> = `{}`

• **queryClient?**: `QueryClient`

## Returns

`Readable`\<`TResult`[]\>

## Defined in

[packages/svelte-query/src/useMutationState.ts:24](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/useMutationState.ts#L24)
