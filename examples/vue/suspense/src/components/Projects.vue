<script setup lang="ts">
import { noop, useQuery, useQueryClient } from '@tanstack/vue-query'
import { projectsQueries } from '../services/projects/queries'
import Button from './Button.vue'
import Spinner from './Spinner.vue'

const emit = defineEmits<{ setActiveProject: [project: string] }>()

const queryClient = useQueryClient()
const { data, isFetching, suspense } = useQuery({
  ...projectsQueries.list(),
  throwOnError: true,
})

await suspense()

const loadProject = (project: string) => {
  // Prefetch the project query
  queryClient.query(projectsQueries.detail(project)).catch(noop)
  emit('setActiveProject', project)
}
</script>

<template>
  <div>
    <h1>TanStack Repositories <Spinner v-if="isFetching" /></h1>
    <p v-for="project in data" :key="project.full_name">
      <Button @click="loadProject(project.full_name)">Load</Button>
      {{ project.name }}
    </p>
  </div>
</template>
