<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const { isPending, isError, data } = useQuery({
  queryKey: ['test'],
  queryFn: async () => {
    await new Promise((r) => setTimeout(r, 1000))
    return 'Success'
  },
})
</script>

<template>
  <div v-if="isPending">Loading...</div>
  <div v-else-if="isError">An error has occurred!</div>
  <div v-else-if="data">{{ data }}</div>
</template>
