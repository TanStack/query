---
id: useMutation
title: useMutation
redirect_from:
  - framework/solid/reference/useMutation
---

```ts
function useMutation<TData, TError, TVariables, TOnMutateResult>(options, queryClient?): UseMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [useMutation.ts:173](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useMutation.ts#L173)

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

## Examples

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

Rendering the mutation's own state, rather than just firing it off:
```tsx
import { Match, Switch } from 'solid-js'
import { useMutation, useQueryClient } from '@tanstack/solid-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

  return (
    <Switch fallback={<button onClick={() => addMutation.mutate('Item')}>Add</button>}>
      <Match when={addMutation.isPending}>Adding todo...</Match>
      <Match when={addMutation.isError}>
        <div>An error occurred: {addMutation.error?.message}</div>
        <button onClick={() => addMutation.mutate('Item')}>Add</button>
      </Match>
    </Switch>
  )
}
```

Optimistic update via `onMutate`, rolling back on `onError`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/solid-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const addMutation = useMutation(() => ({
    mutationFn: addTodo,
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData<Array<string>>(['todos'])

      queryClient.setQueryData<Array<string>>(['todos'], (old) => [
        ...(old ?? []),
        newTodo,
      ])

      // Passed to `onError` as `onMutateResult` if the mutation fails.
      return { previousTodos }
    },
    onError: (_err, _newTodo, onMutateResult) => {
      queryClient.setQueryData(['todos'], onMutateResult?.previousTodos)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  }))

  return (
    <button onClick={() => addMutation.mutate('Item')}>Add</button>
  )
}
```

Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
promise per call instead, so you can wait for all of them when they succeed:
```tsx
import { useMutation, useQueryClient } from '@tanstack/solid-query'

function AddTodos() {
  const queryClient = useQueryClient()

  const addMutation = useMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

  async function handleAddAll(todos: Array<string>) {
    try {
      await Promise.all(todos.map((todo) => addMutation.mutateAsync(todo)))
    } catch (error) {
      console.error('Failed to add todos:', error)
    }
  }

  return (
    <button onClick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
      Add all
    </button>
  )
}
```

If some of the mutations above can fail independently of the others, and you want to know which ones
did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
`Promise.allSettled`:
```tsx
import { useMutation, useQueryClient } from '@tanstack/solid-query'

function AddTodos() {
  const queryClient = useQueryClient()

  const addMutation = useMutation(() => ({
    mutationFn: addTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  }))

  async function handleAddAll(todos: Array<string>) {
    const addResults = await Promise.allSettled(
      todos.map((todo) => addMutation.mutateAsync(todo)),
    )

    addResults.forEach((addResult, index) => {
      if (addResult.status === 'rejected') {
        console.error(`Failed to add "${todos[index]}":`, addResult.reason)
      }
    })
  }

  return (
    <button onClick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
      Add all
    </button>
  )
}
```
