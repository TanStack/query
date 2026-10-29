<script setup lang="ts">
import { defineAsyncComponent, onErrorCaptured, provide, ref } from 'vue'
import { noop, useQueryClient } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { projectsQueries } from './services/projects/queries'
import { isPendingKey } from './transition'
import Button from './components/Button.vue'

const Projects = defineAsyncComponent(() => import('./components/Projects.vue'))
const Project = defineAsyncComponent(() => import('./components/Project.vue'))

const queryClient = useQueryClient()
const showProjects = ref(false)
const activeProject = ref<string | null>(null)
const error = ref<Error | null>(null)
const isPending = ref(false)

provide(isPendingKey, isPending)

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  isPending.value = false
  return false
})

const toggleProjects = () => {
  if (!showProjects.value) {
    queryClient.query(projectsQueries.list()).catch(noop)
  }
  showProjects.value = !showProjects.value
  isPending.value = false
}
</script>

<template>
  <Button @click="toggleProjects">
    {{ showProjects ? 'Hide Projects' : 'Show Projects' }}
  </Button>

  <hr />

  <div v-if="error">
    There was an error!
    <Button @click="error = null">Try again</Button>
    <pre style="white-space: normal">{{ error.message }}</pre>
  </div>
  <Suspense
    v-else-if="showProjects"
    @pending="isPending = true"
    @resolve="isPending = false"
    @fallback="isPending = false"
  >
    <Project
      v-if="activeProject"
      :active-project="activeProject"
      @set-active-project="activeProject = $event"
    />
    <Projects v-else @set-active-project="activeProject = $event" />
    <template #fallback>
      <h1>Loading projects...</h1>
    </template>
  </Suspense>
  <VueQueryDevtools initialIsOpen />
</template>
