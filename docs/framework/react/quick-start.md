---
id: quick-start
title: Quick Start
---

This code snippet very briefly illustrates the 3 core concepts of React Query:

- [Queries](../guides/queries.md)
- [Mutations](../guides/mutations.md)
- [Query Invalidation](../guides/query-invalidation.md)

[//]: # 'Example'

If you're looking for a fully functioning example, please have a look at our [simple StackBlitz example](../examples/simple)

```tsx
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { getTodos, postTodo } from '../my-api'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  )
}

function Todos() {
  // Access the client
  const queryClient = useQueryClient()

  // Queries
  const query = useQuery({ queryKey: ['todos'], queryFn: getTodos })

  // Mutations
  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <div>
      <ul>{query.data?.map((todo) => <li key={todo.id}>{todo.title}</li>)}</ul>

      <button
        onClick={() => {
          mutation.mutate({
            id: Date.now(),
            title: 'Do Laundry',
          })
        }}
      >
        Add Todo
      </button>
    </div>
  )
}

render(<App />, document.getElementById('root'))
```

[//]: # 'Example'

These three concepts make up most of the core functionality of React Query. The next sections of the documentation will go over each of these core concepts in great detail.
