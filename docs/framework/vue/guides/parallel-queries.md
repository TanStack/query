---
id: parallel-queries
title: Parallel Queries
ref: docs/framework/react/guides/parallel-queries.md
---

[//]: # 'Example'

```vue
<script setup lang="ts">
// The following queries will execute in parallel
const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
const projectsQuery = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
})
</script>
```

[//]: # 'Example'
[//]: # 'Info'
[//]: # 'Info'
[//]: # 'Example2'

```js
const users = computed(...)
const queries = computed(() => users.value.map(user => {
    return {
      queryKey: ['user', user.id],
      queryFn: () => fetchUserById(user.id),
    }
  })
);
const userQueries = useQueries({queries: queries})
```

[//]: # 'Example2'
