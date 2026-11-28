<script setup lang="ts">
import { isFetching as queryIsFetching, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { projectsQueries } from '../services/projects/queries'
import BaseButton from './BaseButton.vue'
import BaseSpinner from './BaseSpinner.vue'

const props = defineProps<{ activeProject: string }>()
defineEmits<{ setActiveProject: [project: string | null] }>()

const {
  state: queryState,
  data,
  suspense,
} = useQuery(() => ({
  ...projectsQueries.detail(props.activeProject),
  throwOnError: true,
}))
const isFetching = computed(() => queryIsFetching(queryState))

await suspense()
</script>

<template>
  <div>
    <BaseButton @click="$emit('setActiveProject', null)">Back</BaseButton>
    <h1>{{ activeProject }} <BaseSpinner v-if="isFetching" /></h1>
    <div>
      <p>forks: {{ data?.forks_count }}</p>
      <p>stars: {{ data?.stargazers_count }}</p>
      <p>watchers: {{ data?.subscribers_count }}</p>
    </div>
    <br />
    <br />
  </div>
</template>
