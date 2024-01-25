<script lang="ts">
import { get, set, del } from 'idb-keyval'
import { defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { Post } from './types'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'

const fetcher = async (id: number): Promise<Post> =>
  await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then(
    (response) => response.json(),
  )

export default defineComponent({
  name: 'PostDetails',
  props: {
    postId: {
      type: Number,
      required: true,
    },
  },
  emits: ['setPostId'],
  setup(props) {
    const { isPending, isError, isFetching, data, error } = useQuery({
      queryKey: ['post', props.postId] as const,
      queryFn: () => fetcher(props.postId),
      persister: experimental_createQueryPersister({
        storage: {
          getItem: (key: string) => get(key),
          setItem: (key: string, value: string) => set(key, value),
          removeItem: (key: string) => del(key),
        },
      }).persisterFn,
    })

    return { isPending, isError, isFetching, data, error }
  },
})
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
