---
id: parallel-queries
title: Parallel Queries
---

"Parallel" queries are queries that are executed in parallel, or at the same time so as to maximize fetching concurrency.

## Manual Parallel Queries

When the number of parallel queries does not change, there is **no extra effort** to use parallel queries. Just use any number of React Query's `useQuery` and `useInfiniteQuery` hooks side-by-side!

```tsx
function App () {
  // The following queries will execute in parallel
  const usersQuery = useQuery({ queryKey: ['users'], queyFn: fetchUsers })
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  ...
}
```

> When using React Query in suspense mode, this pattern of parallelism does not work, since the first query would throw a promise internally and would suspend the component before the other queries run. To get around this, you'll either need to use the `useQueries` hook (which is suggested) or orchestrate your own parallelism with separate components for each `useQuery` instance (which is lame).

## Dynamic Parallel Queries with `useQueries`

If the number of queries you need to execute is changing from render to render, you cannot use manual querying since that would violate the rules of hooks. Instead, React Query provides a `useQueries` hook, which you can use to dynamically execute as many queries in parallel as you'd like.

`useQueries` accepts an **options object** with a **queries key** whose value is an **array of query objects**. It returns an **array of query results**:

```tsx
function App({ users }) {
  const userQueries = useQueries({
    queries: users.map(user => {
      return {
        queryKey: ['user', user.id],
        queryFn: () => fetchUserById(user.id),
      }
    })
  })
}
```
