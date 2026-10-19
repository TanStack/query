<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

import type { Post } from './types'

const props = defineProps<{ postId: number }>()
defineEmits<{ setPostId: [id: number] }>()

const fetcher = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  )
  if (!response.ok) throw new Error('Failed to fetch post')
  return await response.json()
}

const { isPending, isError, isFetching, data, error } = useQuery({
  queryKey: ['post', () => props.postId],
  queryFn: () => fetcher(props.postId),
})
</script>

<template>
  <h1>Post {{ postId }}</h1>
  <a @click="$emit('setPostId', -1)" href="#"> Back </a>
  <div v-if="isPending" class="update">Loading...</div>
  <div v-else-if="isError">An error has occurred: {{ error }}</div>
  <div v-else-if="data">
    <h1>{{ data.title }}</h1>
    <div>
      <p>{{ data.body }}</p>
    </div>
    <div v-if="isFetching" class="update">Background Updating...</div>
  </div>
</template>

<style scoped>
.update {
  font-weight: bold;
  color: green;
}
</style>
