---
id: useMutation
title: useMutation
---

# Function: useMutation()

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options, queryClient?): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [preact-query/src/useMutation.ts:20](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutation.ts#L20)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### options

[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

### queryClient?

`QueryClient`

## Returns

[`UseMutationResult`](../type-aliases/UseMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>
