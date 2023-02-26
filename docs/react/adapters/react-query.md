---
title: React Query
---

The `react-query` package offers a 1st-class API for using TanStack Query via React. However, all of the primitives you receive from these hooks are core APIs that are shared across all of the TanStack Adapters including the Query Client, query results, query subscriptions, etc.

## Example

```tsx
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient()

function Example() {
  const query = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

  return (
    <div>
      {query.isPending
        ? 'Loading...'
        : query.isError
        ? 'Error!'
        : query.data
        ? query.data.map((todo) => <div key={todo.id}>{todo.title}</div>)
        : null}
    </div>
  )
}

function App () {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}
```
