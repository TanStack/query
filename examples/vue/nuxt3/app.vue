<template>
  <div>{{ data }}</div>
</template>

<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { postsQueries } from './services/posts/queries'

const { data, suspense } = useQuery(postsQueries.list())

await suspense()
</script>
