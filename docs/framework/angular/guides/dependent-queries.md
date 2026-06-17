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
  queryKey: ['user', email],
  queryFn: getUserByEmail,
}))

// Then get the user's projects
projectsQuery = injectQuery(() => ({
  queryKey: ['projects', this.userQuery.data()?.id],
  queryFn: getProjectsByUser,
  // The query will not execute until the user id exists
  enabled: !!this.userQuery.data()?.id,
}))
```

[//]: # 'Example'
[//]: # 'Example2'

```ts
projectsQueries = injectQueries(() => ({
  queries:
    this.userQuery.data()?.projectIds.map((projectId) => ({
      queryKey: ['project', projectId],
      queryFn: () => getProjectById(projectId),
    })) ?? [],
}))
```

[//]: # 'Example2'
