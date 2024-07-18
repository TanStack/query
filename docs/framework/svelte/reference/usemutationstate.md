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

• **options**: [`MutationStateOptions`](mutationstateoptions.md)\<`TResult`\> = `{}`

• **queryClient?**: `QueryClient`

## Returns

`Readable`\<`TResult`[]\>

## Defined in

[packages/svelte-query/src/useMutationState.ts:24](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/useMutationState.ts#L24)
