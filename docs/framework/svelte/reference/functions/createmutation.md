---
id: createMutation
title: createMutation
---

# Function: createMutation()

```ts
function createMutation<TData, TError, TVariables, TOnMutateResult>(
  options,
  queryClient?,
): CreateMutationResult<TData, TError, TVariables, TOnMutateResult>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TOnMutateResult** = `unknown`

## Parameters

### options

[`StoreOrVal`](../../type-aliases/storeorval.md)\<[`CreateMutationOptions`](../../type-aliases/createmutationoptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

### queryClient?

`QueryClient`

## Returns

[`CreateMutationResult`](../../type-aliases/createmutationresult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Defined in

[packages/svelte-query/src/createMutation.ts:13](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createMutation.ts#L13)
