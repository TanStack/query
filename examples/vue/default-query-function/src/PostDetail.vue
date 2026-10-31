<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import type { Post } from './types'

const props = defineProps<{ postId: number }>()
defineEmits<{ setPostId: [id: number] }>()

// You can even leave out the queryFn and just go straight into options
const { isPending, isError, isFetching, data, error } = useQuery<Post>(() => ({
  queryKey: [`/posts/${props.postId}`],
  enabled: !!props.postId,
}))
</script>

<template>
  <div>
    <div>
      <a href="#posts" @click.prevent="$emit('setPostId', -1)">Back</a>
    </div>
    <div v-if="!postId || isPending">Loading...</div>
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
