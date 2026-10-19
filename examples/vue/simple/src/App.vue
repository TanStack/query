<script lang="ts">
import { defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

export default defineComponent({
  name: 'App',
  components: { VueQueryDevtools },
  setup() {
    const { data, error, isFetching, isPending } = useQuery({
      queryKey: ['repoData'],
      async queryFn() {
        const response = await fetch(
          'https://api.github.com/repos/Tanstack/query',
        )
        if (!response.ok) throw new Error('Failed to fetch repo data')
        return await response.json()
      },
    })

    return {
      data,
      error,
      isFetching,
      isPending,
    }
  },
})
</script>

<template>
  <template v-if="isPending"> Loading... </template>
  <template v-else-if="error">
    An error has occurred: {{ error.message }}
  </template>
  <template v-else>
    <h1>{{ data.name }}</h1>
    <p>{{ data.description }}</p>
    <strong>👀 {{ data.subscribers_count }}</strong>
    <strong>✨ {{ data.stargazers_count }}</strong>
    <strong>🍴 {{ data.forks_count }}</strong>
    <div>{{ isFetching ? 'Updating...' : '' }}</div>
  </template>
  <VueQueryDevtools />
</template>
