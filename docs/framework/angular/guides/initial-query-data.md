---
id: initial-query-data
title: Initial Query Data
ref: docs/framework/react/guides/initial-query-data.md
replace:
  {
    'render': 'service or component instance',
    ' when it mounts': '',
    'after mount': 'after initialization',
    'on mount': 'on initialization',
  }
---

[//]: # 'Example'

```ts
result = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
// Will show initialTodos immediately, but also immediately refetch todos
// when an instance of the component or service is created
result = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```ts
// Show initialTodos immediately, but won't refetch until
// another interaction event is encountered after 1000 ms
result = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
  staleTime: 1000,
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```ts
// Show initialTodos immediately, but won't refetch until
// another interaction event is encountered after 1000 ms
result = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
  staleTime: 60 * 1000, // 1 minute
  // This could be 10 seconds ago or 10 minutes ago
  initialDataUpdatedAt: initialTodosUpdatedTimestamp, // eg. 1608412420052
}))
```

[//]: # 'Example4'
[//]: # 'Example5'

```ts
result = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: () => getExpensiveTodos(),
}))
```

[//]: # 'Example5'
[//]: # 'Example6'

```ts
result = injectQuery(() => ({
  queryKey: ['todo', this.todoId()],
  queryFn: () => fetch(`/todos/${this.todoId()}`),
  initialData: () => {
    // Use a todo from the 'todos' query as the initial data for this todo query
    return this.queryClient
      .getQueryData(['todos'])
      ?.find((d) => d.id === this.todoId())
  },
}))
```

[//]: # 'Example6'
[//]: # 'Example7'

```ts
result = injectQuery(() => ({
  queryKey: ['todos', this.todoId()],
  queryFn: () => fetch(`/todos/${this.todoId()}`),
  initialData: () =>
    this.queryClient
      .getQueryData(['todos'])
      ?.find((d) => d.id === this.todoId()),
  initialDataUpdatedAt: () =>
    this.queryClient.getQueryState(['todos'])?.dataUpdatedAt,
}))
```

[//]: # 'Example7'
[//]: # 'Example8'

```ts
result = injectQuery(() => ({
  queryKey: ['todo', this.todoId()],
  queryFn: () => fetch(`/todos/${this.todoId()}`),
  initialData: () => {
    // Get the query state
    const state = this.queryClient.getQueryState(['todos'])

    // If the query exists and has data that is no older than 10 seconds...
    if (state && Date.now() - state.dataUpdatedAt <= 10 * 1000) {
      // return the individual todo
      return state.data.find((d) => d.id === this.todoId())
    }

    // Otherwise, return undefined and let it fetch from a hard loading state!
  },
}))
```

[//]: # 'Example8'
[//]: # 'Materials'
[//]: # 'Materials'
