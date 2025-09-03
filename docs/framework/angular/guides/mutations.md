---
id: mutations
title: Mutations
ref: docs/framework/react/guides/mutations.md
replace:
  {
    'useMutation': 'injectMutation',
    'hook': 'function',
    'still mounted': 'still active',
    'unmounts': 'gets destroyed',
    'mounted': 'initialized',
  }
---

[//]: # 'Example'

```angular-ts
@Component({
  template: `
    <div>
      @if (mutation.isPending()) {
        <span>Adding todo...</span>
      } @else if (mutation.isError()) {
        <div>An error occurred: {{ mutation.error()?.message }}</div>
      } @else if (mutation.isSuccess()) {
        <div>Todo added!</div>
      }
      <button (click)="mutation.mutate(1)">Create Todo</button>
    </div>
  `,
})
export class TodosComponent {
  todoService = inject(TodoService)
  mutation = injectMutation(() => ({
    mutationFn: (todoId: number) =>
      lastValueFrom(this.todoService.create(todoId)),
  }))
}
```

[//]: # 'Example'
[//]: # 'Info1'
[//]: # 'Info1'
[//]: # 'Example2'
[//]: # 'Example2'
[//]: # 'Example3'

```angular-ts
@Component({
  standalone: true,
  selector: 'todo-item',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="todoForm" (ngSubmit)="onCreateTodo()">
      @if (mutation.error()) {
        <h5 (click)="mutation.reset()">{{ mutation.error() }}</h5>
      }
      <input type="text" formControlName="title" />
      <br />
      <button type="submit">Create Todo</button>
    </form>
  `,
})
export class TodosComponent {
  mutation = injectMutation(() => ({
    mutationFn: createTodo,
  }))

  fb = inject(NonNullableFormBuilder)

  todoForm = this.fb.group({
    title: this.fb.control('', {
      validators: [Validators.required],
    }),
  })

  title = toSignal(this.todoForm.controls.title.valueChanges, {
    initialValue: '',
  })

  onCreateTodo = () => {
    this.mutation.mutate(this.title())
  }
}
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
mutation = injectMutation(() => ({
  mutationFn: addTodo,
  onMutate: (variables, context) => {
    // A mutation is about to happen!

    // Optionally return a scope containing data to use when for example rolling back
    return { id: 1 }
  },
  onError: (error, variables, scope) => {
    // An error happened!
    console.log(`rolling back optimistic update with id ${scope.id}`)
  },
  onSuccess: (data, variables, scope) => {
    // Boom baby!
  },
  onSettled: (data, error, variables, scope) => {
    // Error or success... doesn't matter!
  },
}))
```

[//]: # 'Example4'
[//]: # 'Example5'

```ts
mutation = injectMutation(() => ({
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
mutation = injectMutation(() => ({
  mutationFn: addTodo,
  onSuccess: (data, variables, scope) => {
    // I will fire first
  },
  onError: (error, variables, scope) => {
    // I will fire first
  },
  onSettled: (data, error, variables, scope) => {
    // I will fire first
  },
}))

mutation.mutate(todo, {
  onSuccess: (data, variables, scope) => {
    // I will fire second!
  },
  onError: (error, variables, scope) => {
    // I will fire second!
  },
  onSettled: (data, error, variables, scope) => {
    // I will fire second!
  },
})
```

[//]: # 'Example6'
[//]: # 'Example7'

```ts
export class Example {
  mutation = injectMutation(() => ({
    mutationFn: addTodo,
    onSuccess: (data, variables, scope) => {
      // Will be called 3 times
    },
  }))

  doMutations() {
    ;['Todo 1', 'Todo 2', 'Todo 3'].forEach((todo) => {
      this.mutation.mutate(todo, {
        onSuccess: (data, variables, scope) => {
          // Will execute only once, for the last mutation (Todo 3),
          // regardless which mutation resolves first
        },
      })
    })
  }
}
```

[//]: # 'Example7'
[//]: # 'Example8'

```ts
mutation = injectMutation(() => ({ mutationFn: addTodo }))

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
mutation = injectMutation(() => ({
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

    // Return scope with the optimistic todo
    return { optimisticTodo, client: context.client }
  },
  onSuccess: (result, variables, scope) => {
    // Replace optimistic todo in the todos list with the result
    scope.client.setQueryData(['todos'], (old) =>
      old.map((todo) => (todo.id === scope.optimisticTodo.id ? result : todo)),
    )
  },
  onError: (error, variables, scope) => {
    // Remove optimistic todo from the todos list
    scope.client.setQueryData(['todos'], (old) =>
      old.filter((todo) => todo.id !== scope.optimisticTodo.id),
    )
  },
  retry: 3,
})

class someComponent {
  // Start mutation in some component:
  mutation = injectMutation(() => ({ mutationKey: ['addTodo'] }))

  someMethod() {
    mutation.mutate({ title: 'title' })
  }
}

// If the mutation has been paused because the device is for example offline,
// Then the paused mutation can be dehydrated when the application quits:
const state = dehydrate(queryClient)

// The mutation can then be hydrated again when the application is started:
hydrate(queryClient, state)

// Resume the paused mutations:
queryClient.resumePausedMutations()
```

[//]: # 'Example10'
[//]: # 'Example11'
[//]: # 'Example11'
[//]: # 'Materials'
[//]: # 'Materials'
