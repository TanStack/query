---
id: mutations
title: Mutations
ref: docs/framework/react/guides/mutations.md
---

[//]: # 'Example'

```vue
<script setup>
import { useMutation } from '@tanstack/vue-query'

const { isPending, isError, error, isSuccess, mutate } = useMutation({
  mutationFn: (newTodo) => axios.post('/todos', newTodo),
})

function addTodo() {
  mutate({ id: new Date(), title: 'Do Laundry' })
}
</script>

<template>
  <span v-if="isPending">Adding todo...</span>
  <span v-else-if="isError">An error occurred: {{ error.message }}</span>
  <span v-else-if="isSuccess">Todo added!</span>
  <button @click="addTodo">Create Todo</button>
</template>
```

[//]: # 'Example'
[//]: # 'Info1'
[//]: # 'Info1'
[//]: # 'Example2'
[//]: # 'Example2'
[//]: # 'Example3'

```vue
<script>
import { useMutation } from '@tanstack/vue-query'

const { error, mutate, reset } = useMutation({
  mutationFn: (newTodo) => axios.post('/todos', newTodo),
})

function addTodo() {
  mutate({ id: new Date(), title: 'Do Laundry' })
}
</script>

<template>
  <span v-else-if="error">
    <span>An error occurred: {{ error.message }}</span>
    <button @click="reset">Reset error</button>
  </span>
  <button @click="addTodo">Create Todo</button>
</template>
```

[//]: # 'Example3'
[//]: # 'Example11'

```js
const client = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults({
  mutationKey: ['todos'],
  mutationFn: ({ id, data }) => {
    return api.updateTodo(id, data)
  },
})

const vueQueryOptions: VueQueryPluginOptions = {
  queryClient: client,
  clientPersister: (queryClient) => {
    return persistQueryClient({
      queryClient,
      persister: createAsyncStoragePersister({ storage: localStorage }),
    })
  },
  clientPersisterOnSuccess: (queryClient) => {
    queryClient.resumePausedMutations()
  },
}

createApp(App).use(VueQueryPlugin, vueQueryOptions).mount('#app')
```

[//]: # 'Example11'
[//]: # 'Materials'
[//]: # 'Materials'
