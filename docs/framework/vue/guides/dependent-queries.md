---
id: dependent-queries
title: Dependent Queries
ref: docs/framework/react/guides/dependent-queries.md
---

[//]: # 'Example'

```js
// Get the user
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: () => getUserByEmail(email.value),
})

const userId = computed(() => user.value?.id)
const enabled = computed(() => !!user.value?.id)

// Then get the user's projects
const { isIdle, data: projects } = useQuery({
  queryKey: ['projects', userId],
  queryFn: () => getProjectsByUser(userId.value),
  enabled, // The query will not execute until `enabled == true`
})
```

[//]: # 'Example'
