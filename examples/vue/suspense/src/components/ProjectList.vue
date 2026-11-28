<script setup lang="ts">
import {
  isFetching as queryIsFetching,
  query,
  noop,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { computed } from 'vue'
import { projectsQueries } from '../services/projects/queries'
import BaseButton from './BaseButton.vue'
import BaseSpinner from './BaseSpinner.vue'

const emit = defineEmits<{ setActiveProject: [project: string] }>()

const queryClient = useQueryClient()
const {
  state: queryState,
  data,
  suspense,
} = useQuery({
  ...projectsQueries.list(),
  throwOnError: true,
})
const isFetching = computed(() => queryIsFetching(queryState))

await suspense()

const loadProject = (project: string) => {
  // Prefetch the project query
  query(queryClient, projectsQueries.detail(project)).catch(noop)
  emit('setActiveProject', project)
}
</script>

<template>
  <div>
    <h1>TanStack Repositories <BaseSpinner v-if="isFetching" /></h1>
    <p v-for="project in data" :key="project.full_name">
      <BaseButton @click="loadProject(project.full_name)">Load</BaseButton>
      {{ project.name }}
    </p>
  </div>
</template>
