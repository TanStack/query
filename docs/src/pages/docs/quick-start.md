---
id: quick-start
title: Quick Start
---

This example very briefly illustrates the 3 core concepts of React Query:

- Queries
- Mutations
- Query Invalidation

```js
import { useQuery, useMutation, useQueryClient, QueryCache, QueryClient, QueryClientProvider } from 'react-query'
import { getTodos, postTodo } from '../my-api'

const cache = new QueryCache()
const client = new QueryClient({ cache })

function App() {
  return (
    <QueryClientProvider client={client}>
      <Todos />
    </QueryClientProvider>
  );
}

function Todos() {
  // Client
  const client = useQueryClient()

  // Queries
  const todosQuery = useQuery('todos', getTodos)

  // Mutations
  const [addTodo] = useMutation(postTodo, {
    onSuccess: () => {
      // Refetch
      client.invalidateQueries('todos')
    },
  })

  return (
    <div>
      <ul>
        {todosQuery.data.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>

      <button
        onClick={() =>
          addTodo({
            id: Date.now()
            title: 'Do Laundry',
          })
        }
      >
        Add Todo
      </button>
    </div>
  )
}

render(<App />, document.getElementById('root'));
```

These three concepts make up most of the core functionality of React Query. The next sections of the documentation will go over each of these core concepts in great detail.
