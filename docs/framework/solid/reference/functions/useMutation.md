---
id: useMutation
title: useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options, queryClient?): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [useMutation.ts:46](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useMutation.ts#L46)

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

[`UseMutationOptions`](../type-aliases/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

An accessor returning the [UseMutationOptions](../type-aliases/UseMutationOptions.md) to use.

### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

## Returns

[`UseMutationResult`](../type-aliases/UseMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

`mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
mutation definition. Hook-level callbacks (passed to `options`) fire for every mutation; per-call callbacks
fire only for the latest call you've made, and only while the component is still mounted — unmounting before
the mutation settles removes the subscription and prevents them from firing.

## Example

```tsx
import { useMutation, useQueryClient } from '@tanstack/solid-query'

function TodoItem(props: { id: number }) {
  const queryClient = useQueryClient()

  const deleteTodoMutation = useMutation(() => ({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  }))

  return (
    <button onClick={() => deleteTodoMutation.mutate({ id: props.id })} disabled={deleteTodoMutation.isPending}>
      Delete
    </button>
  )
}
```
