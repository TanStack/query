---
id: query-retries
title: Query Retries
---

When a `useQuery` query fails (the query function throws an error), TanStack Query will automatically retry the query if that query's request has not reached the max number of consecutive retries (defaults to `3`) or a function is provided to determine if a retry is allowed.

You can configure retries both on a global level and an individual query level.

- Setting `retry = false` will disable retries.
- Setting `retry = 6` will retry failing requests 6 times before showing the final error thrown by the function.
- Setting `retry = true` will infinitely retry failing requests.
- Setting `retry = (failureCount, error) => ...` allows for custom logic based on why the request failed. Note that `failureCount` starts at `0` for the first retry attempt.

[//]: # 'Info'

> On the server, retries default to `0` to make server rendering as fast as possible.

[//]: # 'Info'
[//]: # 'Example'

```tsx
import { useQuery } from '@tanstack/react-query'

// Make a specific query retry a certain number of times
const result = useQuery({
  queryKey: ['todos', 1],
  queryFn: fetchTodoListPage,
  retry: 10, // Will retry failed requests 10 times before displaying an error
})
```

[//]: # 'Example'

> Info: Contents of the `error` property will be part of `failureReason` response property of `useQuery` until the last retry attempt. So in above example any error contents will be part of `failureReason` property for first 9 retry attempts (Overall 10 attempts) and finally they will be part of `error` after last attempt if error persists after all retry attempts.

## Retry Delay

By default, TanStack Query chooses a random delay for each retry. This variation, called jitter, spreads out retries when many requests fail at the same time.

The delay is a whole number of milliseconds from 10 ms through the exponential backoff limit. The limit starts at 1 second and doubles for each retry, up to 30 seconds.

To keep the v5 schedule, set `retryDelay` to the previous backoff function.

[//]: # 'Example2'

```tsx
// Keep the v5 retry schedule for all queries
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

[//]: # 'Example2'

You can also set `retryDelay` in the options for one query. Set it to a number to use the same delay in milliseconds for every retry.

[//]: # 'Example3'

```tsx
const result = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
  retryDelay: 1000, // Will always wait 1000ms to retry, regardless of how many retries
})
```

[//]: # 'Example3'

## Background Retry Behavior

When using `refetchInterval` with `refetchIntervalInBackground: true`, retries will pause when the browser tab is inactive. This happens because retries respect the same focus behavior as regular refetches.

If you need continuous retries in the background, consider disabling retries and implementing a custom refetch strategy:

[//]: # 'Example4'

```tsx
const result = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchInterval: (query) => {
    // Refetch more frequently when in error state
    return query.state.status === 'error' ? 5000 : 30000
  },
  refetchIntervalInBackground: true,
  retry: false, // Disable built-in retries
})
```

[//]: # 'Example4'

This approach lets you control retry timing manually while keeping refetches active in the background.
