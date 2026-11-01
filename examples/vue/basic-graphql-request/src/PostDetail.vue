<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { postsQueries } from './services/posts/queries'

const props = defineProps<{ postId: string }>()
defineEmits<{ setPostId: [id: string | null] }>()

const { isPending, isError, isFetching, data, error } = useQuery(() =>
  postsQueries.detail(props.postId),
)
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
