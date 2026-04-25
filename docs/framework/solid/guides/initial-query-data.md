---
id: initial-query-data
title: Initial Query Data
ref: docs/framework/react/guides/initial-query-data.md
replace:
  {
    '@tanstack/react-query': '@tanstack/solid-query',
    'useMutationState[(]': 'useMutationState(() => ',
    'useMutation[(]': 'useMutation(() => ',
    'useQuery[(]': 'useQuery(() => ',
    'useQueries[(]': 'useQueries(() => ',
    'useInfiniteQuery[(]': 'useInfiniteQuery(() => ',
  }
---

[//]: # 'Example'

```tsx
const todosQuery = useQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```tsx
// Will show initialTodos immediately, but also immediately refetch todos after mount
const todosQuery = useQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
}))
```

[//]: # 'Example2'
[//]: # 'Example3'

```tsx
// Show initialTodos immediately, but won't refetch until another interaction event is encountered after 1000 ms
const todosQuery = useQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: initialTodos,
  staleTime: 1000,
}))
```

[//]: # 'Example3'
[//]: # 'Example4'

```tsx
// Show initialTodos immediately, but won't refetch until another interaction event is encountered after 1000 ms
const todosQuery = useQuery(() => ({
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

```tsx
const todosQuery = useQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetch('/todos'),
  initialData: () => getExpensiveTodos(),
}))
```

[//]: # 'Example5'
[//]: # 'Example6'

```tsx
const todoQuery = useQuery(() => ({
  queryKey: ['todo', todoId],
  queryFn: () => fetch('/todos'),
  initialData: () => {
    // Use a todo from the 'todos' query as the initial data for this todo query
    return queryClient.getQueryData(['todos'])?.find((d) => d.id === todoId)
  },
}))
```

[//]: # 'Example6'
[//]: # 'Example7'

```tsx
const todoQuery = useQuery(() => ({
  queryKey: ['todos', todoId],
  queryFn: () => fetch(`/todos/${todoId}`),
  initialData: () =>
    queryClient.getQueryData(['todos'])?.find((d) => d.id === todoId),
  initialDataUpdatedAt: () =>
    queryClient.getQueryState(['todos'])?.dataUpdatedAt,
}))
```

[//]: # 'Example7'
[//]: # 'Example8'

```tsx
const todoQuery = useQuery(() => ({
  queryKey: ['todo', todoId],
  queryFn: () => fetch(`/todos/${todoId}`),
  initialData: () => {
    // Get the query state
    const state = queryClient.getQueryState(['todos'])

    // If the query exists and has data that is no older than 10 seconds...
    if (state && Date.now() - state.dataUpdatedAt <= 10 * 1000) {
      // return the individual todo
      return state.data.find((d) => d.id === todoId)
    }

    // Otherwise, return undefined and let it fetch from a hard loading state!
  },
}))
```

[//]: # 'Example8'
