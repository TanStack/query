<script setup lang="ts">
import {
  isPending as queryIsPending,
  isError as queryIsError,
  isFetching as queryIsFetching,
  useQuery,
} from '@tanstack/vue-query'
import { computed } from 'vue'
import { postsQueries } from './services/posts/queries'

const props = defineProps<{ postId: string }>()
defineEmits<{ setPostId: [id: string | null] }>()

const {
  state: queryState,
  data,
  error,
} = useQuery(() => postsQueries.detail(props.postId))
const isPending = computed(() => queryIsPending(queryState))
const isError = computed(() => queryIsError(queryState))
const isFetching = computed(() => queryIsFetching(queryState))
</script>

<template>
  <div>
    <div>
      <a href="#posts" @click.prevent="$emit('setPostId', null)">Back</a>
    </div>
    <div v-if="isPending">Loading...</div>
    <span v-else-if="isError">Error: {{ error?.message }}</span>
    <template v-else-if="data">
      <h1>{{ data.title }}</h1>
      <div>
        <p>{{ data.body }}</p>
      </div>
      <div>{{ isFetching ? 'Background Updating...' : ' ' }}</div>
    </template>
  </div>
</template>
