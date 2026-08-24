---
id: useMutation
title: useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options, queryClient?): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [preact-query/src/useMutation.ts:42](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutation.ts#L42)

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

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

## Returns

[`UseMutationResult`](../type-aliases/UseMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Example

```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function Example() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: (add: string) => fetch(`/api/data?add=${add}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  return (
    <button onClick={() => addMutation.mutate('Item')}>Add</button>
  )
}
```
