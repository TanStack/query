<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Post } from './types'

defineEmits<{ setPostId: [id: number] }>()

const queryClient = useQueryClient()

// All you have to do now is pass a key!
const { isPending, isError, isFetching, data, error } = useQuery<Array<Post>>({
  queryKey: ['/posts'],
})
</script>

<template>
  <div>
    <h1>Posts</h1>
    <div>
      <div v-if="isPending">Loading...</div>
      <span v-else-if="isError">Error: {{ error?.message }}</span>
      <template v-else-if="data">
        <div>
          <p v-for="post in data" :key="post.id">
            <!-- We can use the queryCache here to show bold links for ones that are cached -->
            <a
              :href="`#${post.id}`"
              :style="
                queryClient.getQueryData([`/posts/${post.id}`])
                  ? { fontWeight: 'bold', color: 'green' }
                  : {}
              "
              @click.prevent="$emit('setPostId', post.id)"
            >
              {{ post.title }}
            </a>
          </p>
        </div>
        <div>{{ isFetching ? 'Background Updating...' : ' ' }}</div>
      </template>
    </div>
  </div>
</template>
