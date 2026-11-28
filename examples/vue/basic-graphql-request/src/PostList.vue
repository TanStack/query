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

defineEmits<{ setPostId: [id: string] }>()

const queryClient = useQueryClient()

const { state: queryState, data, error } = useQuery(postsQueries.list())
const isPending = computed(() => queryIsPending(queryState))
const isError = computed(() => queryIsError(queryState))
const isFetching = computed(() => queryIsFetching(queryState))
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
            <!-- We can find the existing query data here to show bold links for ones that are cached -->
            <a
              :href="`#${post.id}`"
              :style="
                getQueryData(queryClient, postsQueries.detail(post.id).queryKey)
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
