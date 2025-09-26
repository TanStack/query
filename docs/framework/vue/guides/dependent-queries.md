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
[//]: # 'Example2'

```tsx
// Get the users ids
const { data: userIds } = useQuery({
  queryKey: ['users'],
  queryFn: getUsersData,
  select: (users) => users.map((user) => user.id),
})

const queries = computed(() => {
  return userIds.value.length
    ? userIds.value.map((id) => {
        return {
          queryKey: ['messages', id],
          queryFn: () => getMessagesByUsers(id),
        }
      })
    : []
})

// Then get the users messages
const usersMessages = useQueries({
  queries, // if userIds.value is undefined or has no items, an empty array will be returned
})
```

[//]: # 'Example2'
