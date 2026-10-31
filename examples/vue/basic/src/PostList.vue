<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { postsQueries } from './services/posts/queries'

defineEmits<{ setPostId: [id: number] }>()

const queryClient = useQueryClient()

const { isPending, isError, isFetching, data, error } = useQuery(
  postsQueries.list(),
)
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
            visited: queryClient.getQueryData(
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
