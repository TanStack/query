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
import { useQuery, queryOptions } from '@tanstack/react-query'

// Make a specific query retry a certain number of times
const result = useQuery(
  queryOptions({
    queryKey: ['todos', 1],
    queryFn: fetchTodoListPage,
    retry: 10, // Will retry failed requests 10 times before displaying an error
  }),
)
```

[//]: # 'Example'

> Info: Contents of the `error` property will be part of `failureReason` response property of `useQuery` until the last retry attempt. So in above example any error contents will be part of `failureReason` property for first 9 retry attempts (Overall 10 attempts) and finally they will be part of `error` after last attempt if error persists after all retry attempts.

## Retry Delay

By default, each retry waits a random duration from 80% to 100% of the base delay. This jitter spreads out retries when many requests fail at the same time.

The base delay starts at 1 second and doubles for each retry, up to 30 seconds.

| Retry       | Delay range | Average delay |
| ----------- | ----------- | ------------- |
| 1           | 0.8–1 s     | 0.9 s         |
| 2           | 1.6–2 s     | 1.8 s         |
| 3           | 3.2–4 s     | 3.6 s         |
| 4           | 6.4–8 s     | 7.2 s         |
| 5           | 12.8–16 s   | 14.4 s        |
| 6 and later | 24–30 s     | 27 s          |

Set `retryDelay` in the query client's default query options or in the options for one query. Use a number for a fixed delay in milliseconds or a function to calculate the delay for each retry.

[//]: # 'Example3'

```tsx
const result = useQuery(
  queryOptions({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    retryDelay: 1000, // Will always wait 1000ms to retry, regardless of how many retries
  }),
)
```

[//]: # 'Example3'

## Background Retry Behavior

When using `refetchInterval` with `refetchIntervalInBackground: true`, retries will pause when the browser tab is inactive. This happens because retries respect the same focus behavior as regular refetches.

If you need continuous retries in the background, consider disabling retries and implementing a custom refetch strategy:

[//]: # 'Example4'

```tsx
const result = useQuery(
  queryOptions({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    refetchInterval: refetchInterval((query) => {
      // Refetch more frequently when in error state
      return query.state.status === 'error' ? 5000 : 30000
    }),
    refetchIntervalInBackground: true,
    retry: false, // Disable built-in retries
  }),
)
```

[//]: # 'Example4'

This approach lets you control retry timing manually while keeping refetches active in the background.
