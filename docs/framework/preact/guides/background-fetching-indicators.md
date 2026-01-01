---
id: background-fetching-indicators
title: Background Fetching Indicators
---

A query's `status === 'pending'` state is sufficient enough to show the initial hard-loading state for a query, but sometimes you may want to display an additional indicator that a query is refetching in the background. To do this, queries also supply you with an `isFetching` boolean that you can use to show that it's in a fetching state, regardless of the state of the `status` variable:

[//]: # 'Example'

```tsx
function Todos() {
  const {
    status,
    data: todos,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return status === 'pending' ? (
    <span>Loading...</span>
  ) : status === 'error' ? (
    <span>Error: {error.message}</span>
  ) : (
    <>
      {isFetching ? <div>Refreshing...</div> : null}

      <div>
        {todos.map((todo) => (
          <Todo todo={todo} />
        ))}
      </div>
    </>
  )
}
```

[//]: # 'Example'

## Displaying Global Background Fetching Loading State

In addition to individual query loading states, if you would like to show a global loading indicator when **any** queries are fetching (including in the background), you can use the `useIsFetching` hook:

[//]: # 'Example2'

```tsx
import { useIsFetching } from '@tanstack/preact-query'

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  return isFetching ? (
    <div>Queries are fetching in the background...</div>
  ) : null
}
```

[//]: # 'Example2'
