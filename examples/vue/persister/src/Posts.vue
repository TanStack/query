<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { postsQueries } from './services/posts/queries'

defineEmits<{ setPostId: [id: number] }>()

const queryClient = useQueryClient()

const { isPending, isError, isRefetching, data, error } = useQuery(
  postsQueries.list(),
)
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
          @click="$emit('setPostId', item.id)"
          href="#"
          :class="{
            visited: queryClient.getQueryData(
              postsQueries.detail(item.id).queryKey,
            ),
          }"
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
