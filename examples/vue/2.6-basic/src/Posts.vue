<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { postsQueries } from './services/posts/queries'

export default defineComponent({
  name: 'PostsList',
  emits: ['setPostId'],
  setup() {
    const queryClient = useQueryClient()

    const { isPending, isError, isFetching, data, error } = useQuery(
      postsQueries.list(),
    )

    return {
      queryClient,
      postsQueries,
      isPending,
      isError,
      isFetching,
      data,
      error,
    }
  },
})
</script>

<template>
  <div>
    <h1>Posts</h1>
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
      <div v-if="isFetching" class="update">Background Updating...</div>
    </div>
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
