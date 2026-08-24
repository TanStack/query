---
id: useMutation
title: useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options, queryClient?): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [preact-query/src/useMutation.ts:82](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutation.ts#L82)

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

`mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
mutation definition. If you make multiple requests, `onSuccess` will fire only after the latest call you've
made.

## Examples

```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  return (
    <button onClick={() => addMutation.mutate('Item')}>Add</button>
  )
}
```

Optimistic update via `onMutate`, rolling back on `onError`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/preact-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: addTodo,
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData<Array<string>>(['todos'])

      queryClient.setQueryData<Array<string>>(['todos'], (old) => [
        ...(old ?? []),
        newTodo,
      ])

      // Passed to `onError` as `context` if the mutation fails.
      return { previousTodos }
    },
    onError: (_err, _newTodo, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button onClick={() => addMutation.mutate('Item')}>Add</button>
  )
}
```
