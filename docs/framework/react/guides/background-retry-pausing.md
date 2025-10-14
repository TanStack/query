---
id: background-retry-pausing
title: Background Retry Pausing
---

When a query fails and retries are enabled, TanStack Query will pause retry attempts when the browser tab loses focus. This behavior ensures that background tabs don't consume unnecessary resources, but it can create unexpected results when combined with `refetchIntervalInBackground`.

## How Retry Pausing Works

By default, **query retries pause when the browser tab is unfocused** and resume when the tab regains focus. This applies to all retry attempts, including:

- Initial query failures
- Refetch interval failures
- Manual refetch failures

[//]: # 'Example'

```tsx
import { useQuery } from '@tanstack/react-query'

// This query will pause retries when tab loses focus
const { data, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  retry: 3, // Will pause retries in background
  retryDelay: 1000,
})
```

[//]: # 'Example'

When the tab becomes unfocused:

1. Any ongoing retry sequence pauses
2. The query remains in a `pending` state
3. Retries resume when the tab regains focus

## The refetchIntervalInBackground Limitation

The `refetchIntervalInBackground` option controls whether queries should continue refetching when the tab is in the background. However, **this option does not affect retry behavior** - retries still pause regardless of this setting.

[//]: # 'Example2'

```tsx
// Retries still pause when unfocused, even with refetchIntervalInBackground: true
const { data } = useQuery({
  queryKey: ['live-data'],
  queryFn: fetchLiveData,
  refetchInterval: 30000,
  refetchIntervalInBackground: true, // Only affects scheduled refetches
  retry: 3, // These retries will still pause in background
})
```

[//]: # 'Example2'

## When This Becomes Problematic

This behavior can cause issues in applications that need reliable background operation

[//]: # 'Example3'

```tsx
// Real-world example: polling todo list with retries
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchInterval: 60000, // Poll every minute
  refetchIntervalInBackground: true, // Should work in background
  retry: 3, // Retry on failure
})

// Expected: ~12 requests in 3 minutes with network issues
// Actual: Only 2 requests when tab is inactive
```

[//]: # 'Example3'

In the above example, if the network fails while the tab is inactive, retries pause until the user returns to the tab. This defeats the purpose of `refetchIntervalInBackground` for applications that need continuous background synchronization.

## Alternative Approaches

If you need background retries, you can use custom retry logic:

### Custom Retry Function

[//]: # 'Example4'

```tsx
import { focusManager } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['critical-data'],
  queryFn: fetchData,
  refetchInterval: 30000,
  refetchIntervalInBackground: true,
  retry: (failureCount, error) => {
    // Custom logic for background retries
    if (!focusManager.isFocused()) {
      // Limit background retries to prevent resource abuse
      return failureCount < 2 && error.name === 'NetworkError'
    }
    // Normal retry behavior when focused
    return failureCount < 3
  },
})
```

[//]: # 'Example4'

### Disabling Background Retries

[//]: # 'Example5'

```tsx
const { data } = useQuery({
  queryKey: ['non-critical-data'],
  queryFn: fetchData,
  refetchInterval: 30000,
  refetchIntervalInBackground: true,
  retry: (failureCount, error) => {
    // Only retry when tab is focused
    return focusManager.isFocused() ? failureCount < 3 : false
  },
})
```

[//]: # 'Example5'
[//]: # 'Info'

> **Note:** These workarounds have limitations and may not fully solve the underlying architectural constraint. The retry pausing behavior is by design to prevent unnecessary resource consumption in background tabs.

[//]: # 'Info'
