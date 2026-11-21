---
id: optimistic-updates
title: Optimistic Updates
ref: docs/framework/react/guides/optimistic-updates.md
replace:
  { 'React': 'Svelte', 'useMutation': 'createMutation', 'hook': 'function' }
---

[//]: # 'ExampleUI1'

```ts
const addTodoMutation = createMutation(() => ({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  // make sure to _return_ the Promise from the query invalidation
  // so that the mutation stays in `pending` state until the refetch is finished
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
}))
```

[//]: # 'ExampleUI1'
[//]: # 'ExampleUI2'

```svelte
<ul>
  {#each todoQuery.data as todo}
    <li>{todo.text}</li>
  {/each}
  {#if addTodoMutation.isPending}
    <li style:opacity="0.5">{addTodoMutation.variables}</li>
  {/if}
</ul>
```

[//]: # 'ExampleUI2'
[//]: # 'ExampleUI3'

```svelte
{#if addTodoMutation.isError}
  <li style:color="red">
    {addTodoMutation.variables}
    <button onclick={() => addTodoMutation.mutate(addTodoMutation.variables)}>
      Retry
    </button>
  </li>
{/if}
```

[//]: # 'ExampleUI3'
[//]: # 'ExampleUI4'

```ts
// somewhere in your app
const mutation = createMutation(() => ({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  mutationKey: ['addTodo'],
}))

// access variables somewhere else
const variables = useMutationState({
  filters: { mutationKey: ['addTodo'], status: 'pending' },
  select: (mutation) => mutation.state.variables,
})
```

[//]: # 'ExampleUI4'
[//]: # 'Example'

```ts
const queryClient = useQueryClient()

createMutation(() => ({
  mutationFn: updateTodo,
  // When mutate is called:
  onMutate: async (newTodo, context) => {
    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await context.client.cancelQueries({ queryKey: ['todos'] })

    // Snapshot the previous value
    const previousTodos = context.client.getQueryData(['todos'])

    // Optimistically update to the new value
    context.client.setQueryData(['todos'], (old) => [...(old ?? []), newTodo])

    // Return a result with the snapshotted value
    return { previousTodos }
  },
  // If the mutation fails,
  // use the result returned from onMutate to roll back
  onError: (err, newTodo, onMutateResult, context) => {
    context.client.setQueryData(['todos'], onMutateResult.previousTodos)
  },
  // Always refetch after error or success:
  onSettled: (data, error, variables, onMutateResult, context) =>
    context.client.invalidateQueries({ queryKey: ['todos'] }),
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
createMutation(() => ({
  mutationFn: updateTodo,
  // When mutate is called:
  onMutate: async (newTodo, context) => {
    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await context.client.cancelQueries({ queryKey: ['todos', newTodo.id] })

    // Snapshot the previous value
    const previousTodo = context.client.getQueryData(['todos', newTodo.id])

    // Optimistically update to the new value
    context.client.setQueryData(['todos', newTodo.id], newTodo)

    // Return a result with the previous and new todo
    return { previousTodo, newTodo }
  },
  // If the mutation fails, use the result we returned above
  onError: (err, newTodo, onMutateResult, context) => {
    context.client.setQueryData(
      ['todos', onMutateResult?.newTodo.id],
      onMutateResult?.previousTodo,
    )
  },
  // Always refetch after error or success:
  onSettled: (newTodo, error, variables, onMutateResult, context) =>
    context.client.invalidateQueries({ queryKey: ['todos', variables.id] }),
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
createMutation(() => ({
  mutationFn: updateTodo,
  // ...
  onSettled: async (newTodo, error, variables, onMutateResult, context) => {
    if (error) {
      // do something
    }
  },
}))
```

[//]: # 'Example3'
