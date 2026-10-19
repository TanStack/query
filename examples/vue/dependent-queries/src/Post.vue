<script setup lang="ts">
import { computed } from 'vue'
import { skipToken, useQuery } from '@tanstack/vue-query'

import type { Author, Post } from './types'

const props = defineProps<{ postId: number }>()
defineEmits<{ setPostId: [id: number] }>()

const fetchPost = async (id: number): Promise<Post> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
  )
  if (!response.ok) throw new Error('Failed to fetch post')
  return await response.json()
}

const fetchAuthor = async (id: number): Promise<Author> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/users/${id}`,
  )
  if (!response.ok) throw new Error('Failed to fetch author')
  return await response.json()
}

const {
  isPending,
  isError,
  isFetching,
  data: post,
  error,
} = useQuery({
  queryKey: ['post', () => props.postId],
  queryFn: () => fetchPost(props.postId),
})

const authorId = computed(() => post.value?.userId)

const { data: author } = useQuery({
  queryKey: ['author', authorId],
  queryFn: computed(() => {
    const id = authorId.value
    return id === undefined ? skipToken : () => fetchAuthor(id)
  }),
})
</script>

<template>
  <h1>Post {{ postId }}</h1>
  <a @click="$emit('setPostId', -1)" href="#"> Back </a>
  <div v-if="isPending" class="update">Loading...</div>
  <div v-else-if="isError">An error has occurred: {{ error }}</div>
  <div v-else-if="post">
    <h1>
      {{ post.title }} <span v-if="author">by {{ author.name }}</span>
    </h1>
    <div>
      <p>{{ post.body }}</p>
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
