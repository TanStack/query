---
id: createMutation
title: createMutation
---

# Function: createMutation()

```ts
function createMutation<TData, TError, TVariables, TContext>(options, queryClient?): CreateMutationResult<TData, TError, TVariables, TContext>;
```

Defined in: [packages/svelte-query/src/createMutation.svelte.ts:17](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createMutation.svelte.ts#L17)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TContext

`TContext` = `unknown`

## Parameters

### options

[`Accessor`](../../../../../../type-aliases/Accessor.md)\<[`CreateMutationOptions`](../../../../../../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TContext`\>\>

A function that returns mutation options

### queryClient?

[`Accessor`](../../../../../../type-aliases/Accessor.md)\<`QueryClient`\>

Custom query client which overrides provider

## Returns

[`CreateMutationResult`](../../../../../../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`\>
