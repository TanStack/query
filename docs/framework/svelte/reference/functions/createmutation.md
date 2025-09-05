---
id: createMutation
title: createMutation
---

# Function: createMutation()

```ts
function createMutation<TData, TError, TVariables, TScope>(
  options,
  queryClient?,
): CreateMutationResult<TData, TError, TVariables, TScope>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TScope** = `unknown`

## Parameters

### options

[`StoreOrVal`](../../type-aliases/storeorval.md)\<[`CreateMutationOptions`](../../type-aliases/createmutationoptions.md)\<`TData`, `TError`, `TVariables`, `TScope`\>\>

### queryClient?

`QueryClient`

## Returns

[`CreateMutationResult`](../../type-aliases/createmutationresult.md)\<`TData`, `TError`, `TVariables`, `TScope`\>

## Defined in

[packages/svelte-query/src/createMutation.ts:13](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createMutation.ts#L13)
