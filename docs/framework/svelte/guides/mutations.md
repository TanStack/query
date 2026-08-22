---
id: mutations
title: Mutations
ref: docs/framework/react/guides/mutations.md
replace: { 'useMutation': 'createMutation', 'hook': 'function' }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  const mutation = createMutation(() => ({
    mutationFn: (newTodo) => {
      return axios.post('/todos', newTodo)
    },
  }))
</script>

<div>
  {#if mutation.isPending}
    <span>Adding todo...</span>
  {:else if mutation.isError}
    <div>An error occurred: {mutation.error.message}</div>
  {:else if mutation.isSuccess}
    <div>Todo added!</div>
  {/if}
  <button
    onclick={() => {
      mutation.mutate({ id: new Date(), title: 'Do Laundry' })
    }}
  >
    Create Todo
  </button>
</div>
```

[//]: # 'Example'
[//]: # 'Info1'
[//]: # 'Info1'
[//]: # 'Example2'
[//]: # 'Example2'
[//]: # 'Example3'

```svelte
<script lang="ts">
  let title = $state('')
  const mutation = createMutation(() => ({
    mutationFn: createTodo,
  }))
</script>

<form
  onsubmit={(e) => {
    e.preventDefault()
    mutation.mutate({ title: title })
  }}
>
  {#if mutation.error}
    <h5 onclick={() => mutation.reset()}>{mutation.error}</h5>
  {/if}
  <input
    type="text"
    value={title}
    oninput={(e) => (title = e.currentTarget.value)}
  />
  <br />
  <button type="submit">Create Todo</button>
</form>
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
createMutation(() => ({
  mutationFn: addTodo,
  onMutate: (variables, context) => {
    // A mutation is about to happen!

    // Optionally return a result containing data to use when for example rolling back
    return { id: 1 }
  },
  onError: (error, variables, onMutateResult, context) => {
    // An error happened!
    console.log(`rolling back optimistic update with id ${onMutateResult.id}`)
  },
  onSuccess: (data, variables, onMutateResult, context) => {
    // Boom baby!
  },
  onSettled: (data, error, variables, onMutateResult, context) => {
    // Error or success... doesn't matter!
  },
}))
```

[//]: # 'Example4'
[//]: # 'Example5'

```ts
createMutation(() => ({
  mutationFn: addTodo,
  onSuccess: async () => {
    console.log("I'm first!")
  },
  onSettled: async () => {
    console.log("I'm second!")
  },
}))
```

[//]: # 'Example5'
[//]: # 'Example6'

```ts
const mutation = createMutation(() => ({
  mutationFn: addTodo,
  onSuccess: (data, variables, onMutateResult, context) => {
    // I will fire first
  },
  onError: (error, variables, onMutateResult, context) => {
    // I will fire first
  },
  onSettled: (data, error, variables, onMutateResult, context) => {
    // I will fire first
  },
}))

mutation.mutate(todo, {
  onSuccess: (data, variables, onMutateResult, context) => {
    // I will fire second!
  },
  onError: (error, variables, onMutateResult, context) => {
    // I will fire second!
  },
  onSettled: (data, error, variables, onMutateResult, context) => {
    // I will fire second!
  },
})
```

[//]: # 'Example6'
[//]: # 'Example7'

```ts
const mutation = createMutation(() => ({
  mutationFn: addTodo,
  onSuccess: (data, variables, onMutateResult, context) => {
    // Will be called 3 times
  },
}))

const todos = ['Todo 1', 'Todo 2', 'Todo 3']
todos.forEach((todo) => {
  mutation.mutate(todo, {
    onSuccess: (data, variables, onMutateResult, context) => {
      // Will execute only once, for the last mutation (Todo 3),
      // regardless which mutation resolves first
    },
  })
})
```

[//]: # 'Example7'
[//]: # 'Example8'

```ts
const mutation = createMutation(() => ({ mutationFn: addTodo }))

try {
  const todo = await mutation.mutateAsync(todo)
  console.log(todo)
} catch (error) {
  console.error(error)
} finally {
  console.log('done')
}
```

[//]: # 'Example8'
[//]: # 'Example9'

```ts
const mutation = createMutation(() => ({
  mutationFn: addTodo,
  retry: 3,
}))
```

[//]: # 'Example9'
[//]: # 'Example10'

```ts
const queryClient = new QueryClient()

// Define the "addTodo" mutation
queryClient.setMutationDefaults(['addTodo'], {
  mutationFn: addTodo,
  onMutate: async (variables, context) => {
    // Cancel current queries for the todos list
    await context.client.cancelQueries({ queryKey: ['todos'] })

    // Create optimistic todo
    const optimisticTodo = { id: uuid(), title: variables.title }

    // Add optimistic todo to todos list
    context.client.setQueryData(['todos'], (old) => [...old, optimisticTodo])

    // Return a result with the optimistic todo
    return { optimisticTodo }
  },
  onSuccess: (result, variables, onMutateResult, context) => {
    // Replace optimistic todo in the todos list with the result
    context.client.setQueryData(['todos'], (old) =>
      old.map((todo) =>
        todo.id === onMutateResult.optimisticTodo.id ? result : todo,
      ),
    )
  },
  onError: (error, variables, onMutateResult, context) => {
    // Remove optimistic todo from the todos list
    context.client.setQueryData(['todos'], (old) =>
      old.filter((todo) => todo.id !== onMutateResult.optimisticTodo.id),
    )
  },
  retry: 3,
})

// Start mutation in some component:
const mutation = createMutation(() => ({ mutationKey: ['addTodo'] }))
mutation.mutate({ title: 'title' })

// If the mutation has been paused because the device is for example offline,
// Then the paused mutation can be dehydrated when the application quits:
const state = dehydrate(queryClient)

// The mutation can then be hydrated again when the application is started:
hydrate(queryClient, state)

// Resume the paused mutations:
queryClient.resumePausedMutations()
```

[//]: # 'Example10'
[//]: # 'PersistOfflineIntro'
[//]: # 'PersistOfflineIntro'
[//]: # 'Example11'
[//]: # 'Example11'
[//]: # 'OfflineExampleLink'
[//]: # 'OfflineExampleLink'
[//]: # 'ExampleScopes'

```ts
const mutation = createMutation(() => ({
  mutationFn: addTodo,
  scope: {
    id: 'todo',
  },
}))
```

[//]: # 'ExampleScopes'
[//]: # 'Materials'
[//]: # 'Materials'
