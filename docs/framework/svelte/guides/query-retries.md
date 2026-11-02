---
id: query-retries
title: Query Retries
ref: docs/framework/react/guides/query-retries.md
replace:
  {
    '@tanstack/react-query': '@tanstack/svelte-query',
    'useQuery': 'createQuery',
    'useQueries': 'createQueries',
    'useInfiniteQuery': 'createInfiniteQuery',
    'useMutation[(]': 'createMutation(() => ',
    'useQuery[(]': 'createQuery(() => ',
    'useQueries[(]': 'createQueries(() => ',
    'useInfiniteQuery[(]': 'createInfiniteQuery(() => ',
  }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // Make a specific query retry a certain number of times
  const result = createQuery(() => ({
    queryKey: ['todos', 1],
    queryFn: fetchTodoListPage,
    retry: 10, // Will retry failed requests 10 times before displaying an error
  }))
</script>
```

[//]: # 'Example'
[//]: # 'Example2'

```svelte
<script lang="ts">
  // Configure for all queries
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>...</QueryClientProvider>
```

[//]: # 'Example2'
[//]: # 'Example3'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const result = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    retryDelay: 1000, // Will always wait 1000ms to retry, regardless of how many retries
  }))
</script>
```

[//]: # 'Example3'
[//]: # 'Example4'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const result = createQuery(() => ({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    refetchInterval: (query) => {
      // Refetch more frequently when in error state
      return query.state.status === 'error' ? 5000 : 30000
    },
    refetchIntervalInBackground: true,
    retry: false, // Disable built-in retries
  }))
</script>
```

[//]: # 'Example4'
