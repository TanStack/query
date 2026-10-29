<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import {
  keepPreviousData,
  noop,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { projectsQueries } from './services/projects/queries'

const queryClient = useQueryClient()
const page = ref(0)

const { status, data, error, isFetching, isPlaceholderData } = useQuery(() => ({
  ...projectsQueries.list(page.value),
  placeholderData: keepPreviousData,
}))

// Prefetch the next page!
watchEffect(() => {
  if (!isPlaceholderData.value && data.value?.hasMore) {
    queryClient.query(projectsQueries.list(page.value + 1)).catch(noop)
  }
})
</script>

<template>
  <div>
    <p>
      In this example, each page of data remains visible as the next page is
      fetched. The buttons and capability to proceed to the next page are also
      suppressed until the next page cursor is known. Each page is cached as a
      normal query too, so when going to previous pages, you'll see them
      instantaneously while they are also refetched invisibly in the background.
    </p>
    <div v-if="status === 'pending'">Loading...</div>
    <div v-else-if="status === 'error'">Error: {{ error?.message }}</div>
    <!-- `data` will either resolve to the latest page's data -->
    <!-- or if fetching a new page, the last successful page's data -->
    <div v-else>
      <p v-for="project in data?.projects" :key="project.id">
        {{ project.name }}
      </p>
    </div>
    <div>Current Page: {{ page + 1 }}</div>
    <button :disabled="page === 0" @click="page = Math.max(page - 1, 0)">
      Previous Page
    </button>
    {{ ' ' }}
    <button
      :disabled="isPlaceholderData || !data?.hasMore"
      @click="page = data?.hasMore ? page + 1 : page"
    >
      Next Page
    </button>
    <!-- Since the last page's data potentially sticks around between page requests, -->
    <!-- we can use `isFetching` to show a background loading -->
    <!-- indicator since our `status === 'pending'` state won't be triggered -->
    <span v-if="isFetching"> Loading...</span>
    {{ ' ' }}
    <VueQueryDevtools initialIsOpen />
  </div>
</template>
