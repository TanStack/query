<script lang="ts">
import { defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'

import type { Post } from './types'

const fetcher = async (): Promise<Array<Post>> => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) throw new Error('Failed to fetch posts')
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return await response.json()
}

export default defineComponent({
  name: 'PostsList',
  props: {
    isVisited: {
      type: Function,
      required: true,
    },
  },
  emits: ['setPostId'],
  setup() {
    const { isPending, isError, isRefetching, data, error } = useQuery({
      queryKey: ['posts'] as const,
      queryFn: () => fetcher(),
      persister: experimental_createQueryPersister({
        storage: localStorage,
      }).persisterFn,
      staleTime: 5000,
    })

    return {
      isPending,
      isRefetching,
      isError,
      data,
      error,
    }
  },
})
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
          :class="{ visited: isVisited(item.id) }"
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
