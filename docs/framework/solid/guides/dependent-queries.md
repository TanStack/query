---
id: dependent-queries
title: Dependent Queries
ref: docs/framework/react/guides/dependent-queries.md
---

[//]: # 'Example'

```tsx
// Get the user
const userQuery = useQuery(() => ({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
}))

const userId = () => userQuery.data?.id

// Then get the user's projects
const projectsQuery = useQuery(() => ({
  queryKey: ['projects', userId()],
  queryFn: getProjectsByUser,
  // The query will not execute until the userId exists
  enabled: !!userId(),
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```tsx
// Get the users ids
const usersQuery = useQuery(() => ({
  queryKey: ['users'],
  queryFn: getUsersData,
  select: (users) => users.map((user) => user.id),
}))

// Then get the users messages
const usersMessages = useQueries(() => ({
  queries: usersQuery.data
    ? usersQuery.data.map((id) => {
        return {
          queryKey: ['messages', id],
          queryFn: () => getMessagesByUsers(id),
        }
      })
    : [], // if usersQuery.data is undefined, an empty array will be returned
}))
```

[//]: # 'Example2'
