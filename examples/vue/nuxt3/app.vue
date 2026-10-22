<template>
  <div>{{ data }}</div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const fetcher = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!response.ok) throw new Error('Failed to fetch posts')
  return await response.json()
}

const { data, suspense } = useQuery({ queryKey: ['test'], queryFn: fetcher })

await suspense()
</script>
