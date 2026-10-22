<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { authorQueryOptions, postQueryOptions } from './api'

const props = defineProps<{ postId: number }>()
defineEmits<{ setPostId: [id: number] }>()

const {
  isPending,
  isError,
  isFetching,
  data: post,
  error,
} = useQuery(() => postQueryOptions(props.postId))

const authorId = computed(() => post.value?.userId)

const { data: author } = useQuery(() => authorQueryOptions(authorId.value))
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
