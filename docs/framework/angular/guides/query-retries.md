---
id: query-retries
title: Query Retries
ref: docs/framework/react/guides/query-retries.md
replace:
  {
    'Provider': 'Plugin',
    'useQuery': 'injectQuery',
    'useMutation': 'injectMutation',
  }
---

[//]: # 'Info'
[//]: # 'Info'
[//]: # 'Example'

```ts
import { injectQuery } from '@tanstack/angular-query'

// Make a specific query retry a certain number of times
const todoQuery = injectQuery(() => ({
  queryKey: ['todos', 1],
  queryFn: fetchTodoListPage,
  retry: 10, // Will retry failed requests 10 times before displaying an error
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
// Keep the v5 retry schedule for all queries
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/angular-query'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  })

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(createQueryClient)],
})
```

[//]: # 'Example2'

You can also set `retryDelay` in the options for one query. Set it to a number to use the same delay in milliseconds for every retry.

[//]: # 'Example3'

```ts
const todosQuery = injectQuery(() => ({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
  retryDelay: 1000, // Will always wait 1000ms to retry, regardless of how many retries
}))
```

[//]: # 'Example3'
