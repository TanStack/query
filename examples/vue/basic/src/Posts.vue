<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

import type { Post } from './types'

defineProps<{ isVisited: (id: number) => boolean }>()
defineEmits<{ setPostId: [id: number] }>()

const fetcher = async (): Promise<Array<Post>> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) throw new Error('Failed to fetch posts')
  return await response.json()
}

const { isPending, isError, isFetching, data, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetcher,
})
</script>

<template>
  <h1>Posts</h1>
  <div v-if="isPending">Loading...</div>
  <div v-else-if="isError">An error has occurred: {{ error }}</div>
  <div v-else-if="data">
    <ul>
      <li v-for="item in data" :key="item.id">
        <a
          @click="$emit('setPostId', item.id)"
          href="#"
          :class="{ visited: isVisited(item.id) }"
          >{{ item.title }}</a
        >
      </li>
    </ul>
    <div v-if="isFetching" class="update">Background Updating...</div>
  </div>
</template>

<style scoped>
.update {
  font-weight: bold;
  color: green;
}

.visited {
  font-weight: bold;
  color: green;
}
</style>
