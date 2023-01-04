---
id: paginated-queries
title: Paginated / Lagged Queries
ref: docs/react/guides/paginated-queries.md
---

[//]: # 'Example2'

```vue
<script setup lang="ts">
import { ref, Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'

const fetcher = (page: Ref<number>) =>
  fetch(
    `https://jsonplaceholder.typicode.com/posts?_page=${page.value}&_limit=10`,
  ).then((response) => response.json())

const page = ref(1)
const { isLoading, isError, data, error, isFetching, isPreviousData } =
  useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetcher(page),
    keepPreviousData: true,
  })
const prevPage = () => {
  page.value = Math.max(page.value - 1, 1)
}
const nextPage = () => {
  if (!isPreviousData.value) {
    page.value = page.value + 1
  }
}
</script>

<template>
  <h1>Posts</h1>
  <p>Current Page: {{ page }} | Previous data: {{ isPreviousData }}</p>
  <button @click="prevPage">Prev Page</button>
  <button @click="nextPage">Next Page</button>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="isError">An error has occurred: {{ error }}</div>
  <div v-else-if="data">
    <ul>
      <li v-for="item in data" :key="item.id">
        {{ item.title }}
      </li>
    </ul>
  </div>
</template>
```

[//]: # 'Example2'
