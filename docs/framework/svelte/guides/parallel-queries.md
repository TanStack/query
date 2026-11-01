---
id: parallel-queries
title: Parallel Queries
ref: docs/framework/react/guides/parallel-queries.md
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
    'hooks': 'functions',
  }
---

[//]: # 'Example'

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  
  // The following queries will execute in parallel
  const usersQuery = createQuery(() => ({ queryKey: ['users'], queryFn: fetchUsers }))
  const teamsQuery = createQuery(() => ({ queryKey: ['teams'], queryFn: fetchTeams }))
  const projectsQuery = createQuery(() => ({ queryKey: ['projects'], queryFn: fetchProjects }))
  ...
</script>
```

[//]: # 'Example'
[//]: # 'Info'
[//]: # 'Info'
[//]: # 'DynamicParallelIntro'

If the number of queries you need to execute changes, you cannot use manual querying since that would break reactivity. Instead, TanStack Query provides a `createQueries` function, which you can use to dynamically execute as many queries in parallel as you'd like.

[//]: # 'DynamicParallelIntro'
[//]: # 'DynamicParallelDescription'

`createQueries` accepts an **accessor that returns an options object** with a **queries key** whose value is an **array of query objects**. It returns an **array of query results**:

[//]: # 'DynamicParallelDescription'
[//]: # 'Example2'

```svelte
<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'

  const { users }: { users: { id: string }[] } = $props()
  const userQueries = createQueries(() => ({
    queries: users.map((user) => {
      return {
        queryKey: ['user', user.id],
        queryFn: () => fetchUserById(user.id),
      }
    }),
  }))
</script>
```

[//]: # 'Example2'
