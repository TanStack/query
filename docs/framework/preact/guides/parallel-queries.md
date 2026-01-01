---
id: parallel-queries
title: Parallel Queries
---

"Parallel" queries are queries that are executed in parallel, or at the same time so as to maximize fetching concurrency.

## Manual Parallel Queries

When the number of parallel queries does not change, there is **no extra effort** to use parallel queries. Just use any number of TanStack Query's `useQuery` and `useInfiniteQuery` hooks side-by-side!

[//]: # 'Example'

```tsx
function App () {
  // The following queries will execute in parallel
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  ...
}
```

[//]: # 'Example'
[//]: # 'Info'

> When using Preact Query with compat's Suspense, this pattern of parallelism does not work, since the first query would throw a promise internally and would suspend the component before the other queries run. To get around this, you'll either need to use the `useSuspenseQueries` hook (which is suggested) or orchestrate your own parallelism with separate components for each `useSuspenseQuery` instance.

[//]: # 'Info'

## Dynamic Parallel Queries with `useQueries`

[//]: # 'DynamicParallelIntro'

If the number of queries you need to execute is changing from render to render, you cannot use manual querying since that would violate the rules of hooks. Instead, TanStack Query provides a `useQueries` hook, which you can use to dynamically execute as many queries in parallel as you'd like.

[//]: # 'DynamicParallelIntro'

`useQueries` accepts an **options object** with a **queries key** whose value is an **array of query objects**. It returns an **array of query results**:

[//]: # 'Example2'

```tsx
function App({ users }) {
  const userQueries = useQueries({
    queries: users.map((user) => {
      return {
        queryKey: ['user', user.id],
        queryFn: () => fetchUserById(user.id),
      }
    }),
  })
}
```

[//]: # 'Example2'
