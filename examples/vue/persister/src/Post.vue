<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { postsQueries } from './services/posts/queries'

const props = defineProps<{ postId: number }>()
defineEmits<{ setPostId: [id: number] }>()

const { isPending, isError, isFetching, data, error } = useQuery(() =>
  postsQueries.detail(props.postId),
)
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
