---
id: queries
title: Queries
ref: docs/framework/react/guides/queries.md
---

[//]: # 'Example'

```ts
import { useQuery } from '@tanstack/vue-query'

const result = useQuery({ queryKey: ['todos'], queryFn: fetchTodoList })
```

[//]: # 'Example'
[//]: # 'Example3'

```vue
<script setup>
import { useQuery } from '@tanstack/vue-query'

const { isPending, isError, data, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})
</script>

<template>
  <span v-if="isPending">Loading...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <!-- We can assume by this point that `isSuccess === true` -->
  <ul v-else-if="data">
    <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>
```

[//]: # 'Example3'
[//]: # 'Example4'

```vue
<script setup>
import { useQuery } from '@tanstack/vue-query'

const { status, data, error } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodoList,
})
</script>

<template>
  <span v-if="status === 'pending'">Loading...</span>
  <span v-else-if="status === 'error'">Error: {{ error.message }}</span>
  <!-- also status === 'success', but "else" logic works, too -->
  <ul v-else-if="data">
    <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>
```

[//]: # 'Example4'
[//]: # 'Materials'
[//]: # 'Materials'
