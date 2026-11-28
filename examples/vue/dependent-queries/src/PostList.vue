<script setup lang="ts">
import {
  isPending as queryIsPending,
  isError as queryIsError,
  isFetching as queryIsFetching,
  getQueryData,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { computed } from 'vue'
import { postsQueries } from './services/posts/queries'

defineEmits<{ setPostId: [id: number] }>()

const queryClient = useQueryClient()

const { state: queryState, data, error } = useQuery(postsQueries.list())
const isPending = computed(() => queryIsPending(queryState))
const isError = computed(() => queryIsError(queryState))
const isFetching = computed(() => queryIsFetching(queryState))
</script>

<template>
  <h1>Posts</h1>
  <div v-if="isPending">Loading...</div>
  <div v-else-if="isError">An error has occurred: {{ error }}</div>
  <div v-else-if="data">
    <ul>
      <li v-for="item in data" :key="item.id">
        <a
          href="#"
          :class="{
            visited: getQueryData(
              queryClient,
              postsQueries.detail(item.id).queryKey,
            ),
          }"
          @click="$emit('setPostId', item.id)"
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
