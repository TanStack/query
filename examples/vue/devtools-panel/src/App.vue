<script lang="ts">
import { defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

export default defineComponent({
  name: 'App',
  components: { VueQueryDevtoolsPanel },
  setup() {
    const { data, error, isFetching, isPending } = useQuery({
      queryKey: ['repoData'],
      async queryFn() {
        return await fetch('https://api.github.com/repos/Tanstack/query').then(
          (response) => response.json(),
        )
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

// @todo: add button to switch between open & close devtools panel

<template>
  <template v-if="isPending"> Loading... </template>
  <template v-else-if="error">
    'An error has occurred: {{ error.message }}
  </template>
  <template v-else>
    <h1>{{ data.name }}</h1>
    <p>{{ data.description }}</p>
    <strong>👀 {{ data.subscribers_count }}</strong>
    <strong>✨ {{ data.stargazers_count }}</strong>
    <strong>🍴 {{ data.forks_count }}</strong>
    <div>{{ isFetching ? 'Updating...' : '' }}</div>
  </template>
  <VueQueryDevtoolsPanel />
</template>
