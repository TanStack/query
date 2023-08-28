---
id: dependent-queries
title: Dependent Queries
---

Dependent (or serial) queries depend on previous ones to finish before they can execute. To achieve this, it's as easy as using the `enabled` option to tell a query when it is ready to run:

[//]: # 'Example'

```tsx
// Get the user
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

const userId = user?.id

// Then get the user's projects
const {
  status,
  fetchStatus,
  data: projects,
} = useQuery({
  queryKey: ['projects', userId],
  queryFn: getProjectsByUser,
  // The query will not execute until the userId exists
  enabled: !!userId,
})
```

[//]: # 'Example'

The `projects` query will start in:

```tsx
status: 'pending'
isPending: false
fetchStatus: 'idle'
```

As soon as the `user` is available, the `projects` query will be `enabled` and will then transition to:

```tsx
status: 'pending'
isPending: true
fetchStatus: 'fetching'
```

Once we have the projects, it will go to:

```tsx
status: 'success'
isPending: false
fetchStatus: 'idle'
```

## A note about performance

Dependent queries by definition constitutes a form of [request waterfall](../guides/request-waterfalls.md), which hurts performance. If we pretend both queries take the same amount of time, doing them serially instead of in parallel always takes twice as much time, which is especially hurtful when it happens on a client that has high latency. If you can, it's always better to restructure the backend APIs so that both queries can be fetched in parallel, though that might not always be practically feasible.

In the example above, instead of first fetching `getUserByEmail` to be able to `getProjectsByUser`, introducing a new `getProjectsByUserEmail` query would flatten the waterfall.
