---
id: optimistic-updates
title: Optimistic Updates
---

Preact Query provides two ways to optimistically update your UI before a mutation has completed. You can either use the `onMutate` option to update your cache directly, or leverage the returned `variables` to update your UI from the `useMutation` result.

## Via the UI

This is the simpler variant, as it doesn't interact with the cache directly.

[//]: # 'ExampleUI1'

```tsx
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  // make sure to _return_ the Promise from the query invalidation
  // so that the mutation stays in `pending` state until the refetch is finished
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

const { isPending, submittedAt, variables, mutate, isError } = addTodoMutation
```

[//]: # 'ExampleUI1'

you will then have access to `addTodoMutation.variables`, which contain the added todo. In your UI list, where the query is rendered, you can append another item to the list while the mutation `isPending`:

[//]: # 'ExampleUI2'

```tsx
<ul>
  {todoQuery.items.map((todo) => (
    <li key={todo.id}>{todo.text}</li>
  ))}
  {isPending && <li style={{ opacity: 0.5 }}>{variables}</li>}
</ul>
```

[//]: # 'ExampleUI2'

We're rendering a temporary item with a different `opacity` as long as the mutation is pending. Once it completes, the item will automatically no longer be rendered. Given that the refetch succeeded, we should see the item as a "normal item" in our list.

If the mutation errors, the item will also disappear. But we could continue to show it, if we want, by checking for the `isError` state of the mutation. `variables` are _not_ cleared when the mutation errors, so we can still access them, maybe even show a retry button:

[//]: # 'ExampleUI3'

```tsx
{
  isError && (
    <li style={{ color: 'red' }}>
      {variables}
      <button onClick={() => mutate(variables)}>Retry</button>
    </li>
  )
}
```

[//]: # 'ExampleUI3'

### If the mutation and the query don't live in the same component

This approach works very well if the mutation and the query live in the same component. However, you also get access to all mutations in other components via the dedicated `useMutationState` hook. It is best combined with a `mutationKey`:

[//]: # 'ExampleUI4'

```tsx
// somewhere in your app
const { mutate } = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  mutationKey: ['addTodo'],
})

// access variables somewhere else
const variables = useMutationState<string>({
  filters: { mutationKey: ['addTodo'], status: 'pending' },
  select: (mutation) => mutation.state.variables,
})
```

[//]: # 'ExampleUI4'

`variables` will be an `Array`, because there might be multiple mutations running at the same time. If we need a unique key for the items, we can also select `mutation.state.submittedAt`. This will even make displaying concurrent optimistic updates a breeze.

## Via the cache

When you optimistically update your state before performing a mutation, there is a chance that the mutation will fail. In most of these failure cases, you can just trigger a refetch for your optimistic queries to revert them to their true server state. In some circumstances though, refetching may not work correctly and the mutation error could represent some type of server issue that won't make it possible to refetch. In this event, you can instead choose to roll back your update.

To do this, `useMutation`'s `onMutate` handler option allows you to return a value that will later be passed to both `onError` and `onSettled` handlers as the last argument. In most cases, it is most useful to pass a rollback function.

### Updating a list of todos when adding a new todo

[//]: # 'Example'

```tsx
const queryClient = useQueryClient()

useMutation({
  mutationFn: updateTodo,
  // When mutate is called:
  onMutate: async (newTodo, context) => {
    // Cancel any outgoing refetches
    // (so they don't overwrite our optimistic update)
    await context.client.cancelQueries({ queryKey: ['todos'] })

    // Snapshot the previous value
    const previousTodos = context.client.getQueryData(['todos'])

    // Optimistically update to the new value
    context.client.setQueryData(['todos'], (old) => [...old, newTodo])

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
})
```

[//]: # 'Example'

### Updating a single todo

[//]: # 'Example2'

```tsx
useMutation({
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
      ['todos', onMutateResult.newTodo.id],
      onMutateResult.previousTodo,
    )
  },
  // Always refetch after error or success:
  onSettled: (newTodo, error, variables, onMutateResult, context) =>
    context.client.invalidateQueries({ queryKey: ['todos', newTodo.id] }),
})
```

[//]: # 'Example2'

You can also use the `onSettled` function in place of the separate `onError` and `onSuccess` handlers if you wish:

[//]: # 'Example3'

```tsx
useMutation({
  mutationFn: updateTodo,
  // ...
  onSettled: async (newTodo, error, variables, onMutateResult, context) => {
    if (error) {
      // do something
    }
  },
})
```

[//]: # 'Example3'

## When to use what

If you only have one place where the optimistic result should be shown, using `variables` and updating the UI directly is the approach that requires less code and is generally easier to reason about. For example, you don't need to handle rollbacks at all.

However, if you have multiple places on the screen that would require to know about the update, manipulating the cache directly will take care of this for you automatically.

[//]: # 'Materials'

## Further reading

Have a look at the guide by TkDodo on [Concurrent Optimistic Updates](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query).

[//]: # 'Materials'
