---
id: quick-start
title: Quick Start
---

Create one `QueryClient` for the browser application, provide it above query
consumers, and call the Octane hooks from component bodies.

```tsrx
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/octane-query'
import { addTodo, getTodos } from './api'

const queryClient = new QueryClient()

function Todos() @{
  const client = useQueryClient()
  const todos = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })
  const addTodoMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  @if (todos.isPending) {
    <p>{'Loading...'}</p>
  } @else if (todos.isError) {
    <p>{todos.error.message}</p>
  } @else {
    <ul>
      {todos.data.map((todo) => <li>{todo.title}</li>)}
    </ul>
    <button
      disabled={addTodoMutation.isPending}
      onClick={() => addTodoMutation.mutate({ title: 'Read the Query docs' })}
    >
      {'Add todo'}
    </button>
  }
}

function App() @{
  <QueryClientProvider client={queryClient}>
    <Todos />
  </QueryClientProvider>
}
```

Query option objects, keys, invalidation, retries, caching, and mutations use
the same TanStack Query contracts as the other framework adapters. The Octane
adapter changes the rendering and subscription layer, not Query Core.
