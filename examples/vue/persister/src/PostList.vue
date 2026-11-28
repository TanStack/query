<script setup lang="ts">
import {
  isPending as queryIsPending,
  isError as queryIsError,
  isRefetching as queryIsRefetching,
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
const isRefetching = computed(() => queryIsRefetching(queryState))
</script>

<template>
  <h1>Posts</h1>
  <div v-if="isRefetching">Refetching...</div>
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
  </div>
</template>

<style scoped>
.visited {
  font-weight: bold;
  color: green;
}
</style>
