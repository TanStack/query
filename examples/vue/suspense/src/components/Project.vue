<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button.vue'
import Spinner from './Spinner.vue'

const props = defineProps<{ activeProject: string }>()
defineEmits<{ setActiveProject: [project: string | null] }>()

const { data, isFetching, suspense } = useQuery(() => ({
  ...projectsQueries.detail(props.activeProject),
  throwOnError: true,
}))

await suspense()
</script>

<template>
  <div>
    <Button @click="$emit('setActiveProject', null)">Back</Button>
    <h1>{{ activeProject }} <Spinner v-if="isFetching" /></h1>
    <div>
      <p>forks: {{ data?.forks_count }}</p>
      <p>stars: {{ data?.stargazers_count }}</p>
      <p>watchers: {{ data?.subscribers_count }}</p>
    </div>
    <br />
    <br />
  </div>
</template>
