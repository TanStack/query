<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

import type { Repo } from './types'

const { data, error, isFetching, isPending } = useQuery({
  queryKey: ['repoData'],
  async queryFn(): Promise<Repo> {
    const response = await fetch('https://api.github.com/repos/TanStack/query')
    if (!response.ok) throw new Error('Failed to fetch repo data')
    return await response.json()
  },
})
</script>

<template>
  <template v-if="isPending"> Loading... </template>
  <template v-else-if="error">
    An error has occurred: {{ error.message }}
  </template>
  <template v-else-if="data">
    <h1>{{ data.name }}</h1>
    <p>{{ data.description }}</p>
    <strong>👀 {{ data.subscribers_count }}</strong>
    <strong>✨ {{ data.stargazers_count }}</strong>
    <strong>🍴 {{ data.forks_count }}</strong>
    <div>{{ isFetching ? 'Updating...' : '' }}</div>
  </template>
  <VueQueryDevtools />
</template>
