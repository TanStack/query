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
