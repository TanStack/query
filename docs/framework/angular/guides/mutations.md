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
      @if (createTodoMutation.isPending()) {
        <span>Adding todo...</span>
      } @else if (createTodoMutation.isError()) {
        <div>An error occurred: {{ createTodoMutation.error()?.message }}</div>
      } @else if (createTodoMutation.isSuccess()) {
        <div>Todo added!</div>
      }
      <button (click)="createTodoMutation.mutate(1)">Create Todo</button>
    </div>
  `,
})
export class TodosComponent {
  readonly todoService = inject(TodoService)
  readonly createTodoMutation = injectMutation(() => ({
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
  selector: 'todo-item',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="todoForm" (ngSubmit)="onCreateTodo()">
      @if (createTodoMutation.error()) {
        <h5 (click)="createTodoMutation.reset()">
          {{ createTodoMutation.error() }}
        </h5>
      }
      <input type="text" formControlName="title" />
      <br />
      <button type="submit">Create Todo</button>
    </form>
  `,
})
export class TodosComponent {
  readonly createTodoMutation = injectMutation(() => ({
    mutationFn: createTodo,
  }))

  readonly fb = inject(NonNullableFormBuilder)

  todoForm = this.fb.group({
    title: this.fb.control('', {
      validators: [Validators.required],
    }),
  })

  title = toSignal(this.todoForm.controls.title.valueChanges, {
    initialValue: '',
  })

  onCreateTodo = () => {
    this.createTodoMutation.mutate(this.title())
  }
}
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
addTodoMutation = injectMutation(() => ({
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
addTodoMutation = injectMutation(() => ({
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
addTodoMutation = injectMutation(() => ({
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

addTodoMutation.mutate(todo, {
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
export class Example {
  readonly addTodoMutation = injectMutation(() => ({
    mutationFn: addTodo,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Will be called 3 times
    },
  }))

  doMutations() {
    ;['Todo 1', 'Todo 2', 'Todo 3'].forEach((todo) => {
      this.addTodoMutation.mutate(todo, {
        onSuccess: (data, variables, onMutateResult, context) => {
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
addTodoMutation = injectMutation(() => ({ mutationFn: addTodo }))

try {
  const todo = await addTodoMutation.mutateAsync(todo)
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
addTodoMutation = injectMutation(() => ({
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

    // Return result with the optimistic todo
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

class someComponent {
  // Start mutation in some component:
  readonly addTodoMutation = injectMutation(() => ({
    mutationKey: ['addTodo'],
  }))

  someMethod() {
    addTodoMutation.mutate({ title: 'title' })
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

See [Error handling](./error-handling.md) to connect cache failures to Angular’s `ErrorHandler`.
