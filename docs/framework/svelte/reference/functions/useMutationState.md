---
id: useMutationState
title: useMutationState
---

```ts
function useMutationState<TResult, TMutation>(options, queryClient?): TResult[];
```

Defined in: [packages/svelte-query/src/useMutationState.svelte.ts:29](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useMutationState.svelte.ts#L29)

## Type Parameters

### TResult

`TResult` = `MutationState`\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* `Mutation`\<`any`, `any`, `any`, `any`\> = [`MutationTypeFromResult`](../type-aliases/MutationTypeFromResult.md)\<`TResult`\>

## Parameters

### options

[`MutationStateOptions`](../type-aliases/MutationStateOptions.md)\<`TResult`, `TMutation`\> = `{}`

### queryClient?

`QueryClient`

## Returns

`TResult`[]
