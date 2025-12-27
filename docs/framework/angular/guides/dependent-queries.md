---
id: dependent-queries
title: Dependent Queries
ref: docs/framework/react/guides/dependent-queries.md
replace: { 'useQuery': 'injectQuery', 'useQueries': 'injectQueries' }
---

[//]: # 'Example'

```ts
// Get the user
userQuery = injectQuery(() => ({
  queryKey: ['user', this.email()],
  queryFn: this.getUserByEmail,
}))

// Then get the user's projects
projectsQuery = injectQuery(() => ({
  queryKey: ['projects', this.userQuery.data()?.id],
  queryFn: this.getProjectsByUser,
  // The query will not execute until the user id exists
  enabled: !!this.userQuery.data()?.id,
}))
```

[//]: # 'Example'
[//]: # 'Example2'

Dynamic parallel query - `injectQueries` can depend on a previous query also, here's how to achieve this:

> IMPORTANT: `injectQueries` is experimental and is provided in it's own entry point

```ts
// Get the users ids
userIds = injectQuery(() => ({
  queryKey: ['users'],
  queryFn: getUserData,
  select: (users) => users.map((user) => user.id),
}))

// Then get the users messages
userQueries = injectQueries(() => ({
  queries: (this.userIds() ?? []).map((userId) => ({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
  })),
}))
```

[//]: # 'Example2'
