---
id: disabling-queries
title: Disabling/Pausing Queries
ref: docs/react/guides/disabling-queries.md
---

[//]: # 'Example'

```vue
<script setup>
import { useQuery } from '@tanstack/vue-query'

const { isInitialLoading, isError, data, error, refetch, isFetching } =
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
    enabled: false,
  })
</script>

<template>
  <button @click="refetch">Fetch Todos</button>
  <span v-if="isIdle">Not ready...</span>
  <span v-else-if="isError">Error: {{ error.message }}</span>
  <div v-else-if="data">
    <span v-if="isFetching">Fetching...</span>
    <ul>
      <li v-for="todo in data" :key="todo.id">{{ todo.title }}</li>
    </ul>
  </div>
</template>
```

[//]: # 'Example'
[//]: # 'Example2'

```vue
<script setup>
import { useQuery } from '@tanstack/vue-query'

const filter = ref('')
const isEnabled = computed(() => !!filter.value)
const { data } = useQuery({
  queryKey: ['todos', filter],
  queryFn: () => fetchTodos(filter),
  // ⬇️ disabled as long as the filter is empty
  enabled: isEnabled,
})
</script>

<template>
  <span v-if="data">Filter was set and data is here!</span>
</template>
```

[//]: # 'Example2'
