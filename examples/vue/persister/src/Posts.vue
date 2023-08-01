<script lang="ts">
import { defineComponent } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'

import { Post } from './types'
import { createPersister } from './persister'

const fetcher = async (): Promise<Post[]> =>
  await fetch('https://jsonplaceholder.typicode.com/posts').then((response) =>
    new Promise((resolve) => setTimeout(() => resolve(response.json()), 2000)),
  )

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
    const queryClient = useQueryClient()

    const { isPending, isError, isFetching, isRefetching, data, error, refetch, isLoading } = useQuery({
      queryKey: ['posts'],
      queryFn: fetcher,
      persister: createPersister({
        storage: localStorage,
        queryClient,
      })
    })

    return { isPending, isLoading, isRefetching, isError, isFetching, data, error, refetch }
  },
})
</script>

<template>
  <h1>Posts</h1>
  <div v-if="isRefetching">Refetching...</div>
  <div v-if="isPending">Pending...</div>
  <div v-if="isLoading">Loading...</div>
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
