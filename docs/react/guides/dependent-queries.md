---
id: dependent-queries
title: Dependent Queries
---

## useQuery dependent Query

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
status: 'loading'
fetchStatus: 'idle'
```

As soon as the `user` is available, the `projects` query will be `enabled` and will then transition to:

```tsx
status: 'loading'
fetchStatus: 'fetching'
```

Once we have the projects, it will go to:

```tsx
status: 'success'
fetchStatus: 'idle'
```

## useQueries dependent Query

Dynamic parallel query - `useQueries` can depend on a previous query also, here's how to achieve this:

[//]: # 'Example2'

```tsx
// Get the users ids
const { data: userIds } = useQuery({
  queryKey: ['users'],
  queryFn: getUsersData,
  select: users => users.map(user => user.id),
})

// Then get the users messages
const usersMessages = useQueries({
  queries: userIds
    ? usersId.map(id => {
        return {
          queryKey: ['messages', id],
          queryFn: () => getMessagesByUsers(id),
        };
      })
  : [], // if users is undefined, an empty array will be returned
})
```

[//]: # 'Example2'

**Note** that `useQueries` return an **array of query results**
