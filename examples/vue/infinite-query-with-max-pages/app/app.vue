<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { projectsQueries } from './services/projects/queries'

const {
  status,
  data,
  error,
  isFetching,
  isFetchingNextPage,
  isFetchingPreviousPage,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
} = useInfiniteQuery(projectsQueries.infinite())
</script>

<template>
  <div>
    <h1>Infinite Query with max pages</h1>
    <h3>4 projects per page</h3>
    <h3>3 pages max</h3>
    <p v-if="status === 'pending'">Loading...</p>
    <span v-else-if="status === 'error'">Error: {{ error?.message }}</span>
    <template v-else>
      <div>
        <button
          :disabled="!hasPreviousPage || isFetchingPreviousPage"
          @click="fetchPreviousPage()"
        >
          {{
            isFetchingPreviousPage
              ? 'Loading more...'
              : hasPreviousPage
                ? 'Load Older'
                : 'Nothing more to load'
          }}
        </button>
      </div>
      <template v-for="page in data?.pages" :key="String(page.nextId)">
        <p
          v-for="project in page.data"
          :key="project.id"
          :style="{
            border: '1px solid gray',
            borderRadius: '5px',
            padding: '8px',
            fontSize: '14px',
            background: `hsla(${project.id * 30}, 60%, 80%, 1)`,
          }"
        >
          {{ project.name }}
        </p>
      </template>
      <div>
        <button
          :disabled="!hasNextPage || isFetchingNextPage"
          @click="fetchNextPage()"
        >
          {{
            isFetchingNextPage
              ? 'Loading more...'
              : hasNextPage
                ? 'Load Newer'
                : 'Nothing more to load'
          }}
        </button>
      </div>
      <div>
        {{ isFetching && !isFetchingNextPage ? 'Background Updating...' : '' }}
      </div>
    </template>
    <hr />
    <VueQueryDevtools initialIsOpen />
  </div>
</template>
