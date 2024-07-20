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

• **options**: [`MutationStateOptions`](MutationStateOptions.md)\<`TResult`\> = `{}`

• **queryClient?**: `QueryClient`

## Returns

`Readable`\<`TResult`[]\>

## Defined in

[packages/svelte-query/src/useMutationState.ts:24](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/useMutationState.ts#L24)
