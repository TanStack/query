<script setup lang="ts">
import {
  isPending as queryIsPending,
  isError as queryIsError,
  isFetching as queryIsFetching,
  useQuery,
} from '@tanstack/vue-query'
import { computed } from 'vue'
import { postsQueries } from './services/posts/queries'

const props = defineProps<{ postId: number }>()
defineEmits<{ setPostId: [id: number] }>()

const {
  state: queryState,
  data,
  error,
} = useQuery(() => postsQueries.detail(props.postId))
const isPending = computed(() => queryIsPending(queryState))
const isError = computed(() => queryIsError(queryState))
const isFetching = computed(() => queryIsFetching(queryState))
</script>

<template>
  <h1>Post {{ postId }}</h1>
  <a href="#" @click="$emit('setPostId', -1)"> Back </a>
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
