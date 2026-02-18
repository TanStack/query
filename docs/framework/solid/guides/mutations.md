---
id: mutations
title: Mutations
ref: docs/framework/react/guides/mutations.md
replace:
  {
    'hook': 'function',
  }
---

[//]: # 'Example'

```tsx
import { Switch, Match, Show } from 'solid-js'

function App() {
  const mutation = useMutation(() => ({
    mutationFn: (newTodo) => {
      return axios.post('/todos', newTodo)
    },
  }))

  return (
    <div>
      <Switch>
        <Match when={mutation.isPending}>
          Adding todo...
        </Match>
        <Match when={true}>
          <Show when={mutation.isError}>
            <div>An error occurred: {mutation.error.message}</div>
          </Show>

          <Show when={mutation.isSuccess}>
            <div>Todo added!</div>
          </Show>

          <button
            onClick={() => {
              mutation.mutate({ id: new Date(), title: 'Do Laundry' })
            }}
          >
            Create Todo
          </button>
        </Match>
      </Switch>
    </div>
  )
}
```

[//]: # 'Example'
[//]: # 'Info1'
[//]: # 'Info1'
[//]: # 'Example2'

```tsx
const CreateTodo = () => {
  const mutation = useMutation(() => ({
    mutationFn: (formData) => {
      return fetch('/api', formData)
    },
  }))
  const onSubmit = (event) => {
    event.preventDefault()
    mutation.mutate(new FormData(event.target))
  }

  return <form onSubmit={onSubmit}>...</form>
}
```

[//]: # 'Example2'
[//]: # 'Example3'

```tsx
import { createSignal, Show } from 'solid-js'

const CreateTodo = () => {
  const [title, setTitle] = createSignal('')
  const mutation = useMutation(() => ({ mutationFn: createTodo }))

  const onCreateTodo = (e) => {
    e.preventDefault()
    mutation.mutate({ title: title() })
  }

  return (
    <form onSubmit={onCreateTodo}>
      <Show when={mutation.error}>
        <h5 onClick={() => mutation.reset()}>{mutation.error}</h5>
      </Show>
      <input
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
      />
      <br />
      <button type="submit">Create Todo</button>
    </form>
  )
}
```

[//]: # 'Example3'
[//]: # 'Example4'

```tsx
useMutation(() => ({
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

```tsx
useMutation(() => ({
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

```tsx
useMutation(() => ({
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

mutate(todo, {
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

```tsx
useMutation(() => ({
  mutationFn: addTodo,
  onSuccess: (data, variables, onMutateResult, context) => {
    // Will be called 3 times
  },
}))

const todos = ['Todo 1', 'Todo 2', 'Todo 3']
todos.forEach((todo) => {
  mutate(todo, {
    onSuccess: (data, variables, onMutateResult, context) => {
      // Will execute only once, for the last mutation (Todo 3),
      // regardless which mutation resolves first
    },
  })
})
```

[//]: # 'Example7'
[//]: # 'Example8'

```tsx
const mutation = useMutation(() => ({ mutationFn: addTodo }))

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

```tsx
const mutation = useMutation(() => ({
  mutationFn: addTodo,
  retry: 3,
}))
```

[//]: # 'Example9'
[//]: # 'Example10'

```tsx
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
const mutation = useMutation(() => ({ mutationKey: ['addTodo'] }))
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

### Persisting Offline mutations

If you persist offline mutations with the `persistQueryClient` plugin, mutations cannot be resumed when the page is reloaded unless you provide a default mutation function.

[//]: # 'PersistOfflineIntro'
[//]: # 'OfflineExampleLink'
[//]: # 'OfflineExampleLink'
[//]: # 'ExampleScopes'

```tsx
const mutation = useMutation(() => ({
  mutationFn: addTodo,
  scope: {
    id: 'todo',
  },
}))
```

[//]: # 'ExampleScopes'
[//]: # 'Materials'

## Further reading

For more information about mutations, have a look at [TkDodo's article on Mastering Mutations in TanStack Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query).

[//]: # 'Materials'
