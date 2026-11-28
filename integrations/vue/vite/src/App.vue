<script setup lang="ts">
import {
  isPending as queryIsPending,
  isError as queryIsError,
  useQuery,
} from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { computed } from 'vue'

const { state: queryState, data } = useQuery({
  queryKey: ['test'],
  queryFn: async () => {
    await new Promise((r) => setTimeout(r, 1000))
    return 'Success'
  },
})
const isPending = computed(() => queryIsPending(queryState))
const isError = computed(() => queryIsError(queryState))
</script>

<template>
  <div v-if="isPending">Loading...</div>
  <div v-else-if="isError">An error has occurred!</div>
  <div v-else-if="data">{{ data }}</div>
  <VueQueryDevtools />
</template>
