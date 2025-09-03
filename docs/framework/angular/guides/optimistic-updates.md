---
id: optimistic-updates
title: Optimistic Updates
ref: docs/framework/react/guides/optimistic-updates.md
replace:
  {
    'React': 'Angular',
    'useMutation': 'injectMutation',
    'hook': 'function',
    'useMutationState': 'injectMutationState',
    'addTodoMutation': 'addTodo',
  }
---

[//]: # 'ExampleUI1'

```ts
addTodo = injectMutation(() => ({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  // make sure to _return_ the Promise from the query invalidation
  // so that the mutation stays in `pending` state until the refetch is finished
  onSettled: async () => {
    return await queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
}))
```

[//]: # 'ExampleUI1'
[//]: # 'ExampleUI2'

```angular-ts
@Component({
  template: `
    @for (todo of todos.data(); track todo.id) {
      <li>{{ todo.title }}</li>
    }
    @if (addTodo.isPending()) {
      <li style="opacity: 0.5">{{ addTodo.variables() }}</li>
    }
  `,
})
class TodosComponent {}
```

[//]: # 'ExampleUI2'
[//]: # 'ExampleUI3'

```angular-ts
@Component({
  template: `
    @if (addTodo.isError()) {
      <li style="color: red">
        {{ addTodo.variables() }}
        <button (click)="addTodo.mutate(addTodo.variables())">Retry</button>
      </li>
    }
  `,
})
class TodosComponent {}
```

[//]: # 'ExampleUI3'
[//]: # 'ExampleUI4'

```ts
// somewhere in your app
addTodo = injectMutation(() => ({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  mutationKey: ['addTodo'],
}))

// access variables somewhere else

mutationState = injectMutationState<string>(() => ({
  filters: { mutationKey: ['addTodo'], status: 'pending' },
  select: (mutation) => mutation.state.variables,
}))
```

[//]: # 'ExampleUI4'
[//]: # 'Example'

```ts
queryClient = inject(QueryClient)

updateTodo = injectMutation(() => ({
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

    // Return a scope object with the snapshotted value
    return { previousTodos, client: context.client }
  },
  // If the mutation fails,
  // use the scope returned from onMutate to roll back
  onError: (err, newTodo, scope) => {
    scope.client.setQueryData(['todos'], scope.previousTodos)
  },
  // Always refetch after error or success:
  onSettled: (data, error, variables, scope) => {
    scope.client.invalidateQueries({ queryKey: ['todos'] })
  },
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
queryClient = inject(QueryClient)

updateTodo = injectMutation(() => ({
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

    // Return a scope with the previous and new todo
    return { previousTodo, newTodo, client: context.client }
  },
  // If the mutation fails, use the scope we returned above
  onError: (err, newTodo, scope) => {
    scope.client.setQueryData(['todos', scope.newTodo.id], scope.previousTodo)
  },
  // Always refetch after error or success:
  onSettled: (newTodo, error, variables, scope) => {
    scope.client.invalidateQueries({ queryKey: ['todos', newTodo.id] })
  },
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
injectMutation({
  mutationFn: updateTodo,
  // ...
  onSettled: (newTodo, error, variables, scope) => {
    if (error) {
      // do something
    }
  },
})
```

[//]: # 'Example3'
