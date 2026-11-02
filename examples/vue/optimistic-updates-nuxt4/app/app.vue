<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import ApproachTabs from './components/ApproachTabs.vue'

useHead({
  title: 'TanStack Query — Optimistic Updates',
  meta: [
    {
      name: 'description',
      content: 'Nuxt example with optimistic updates',
    },
  ],
})
</script>

<template>
  <main style="max-width: 600px; margin: 0 auto; padding: 2rem 1rem">
    <h1>Optimistic Updates with TanStack Query</h1>
    <p style="color: #666; margin-bottom: 1.5rem">
      Add todos to see optimistic updates in action. The server randomly fails
      ~30% of the time so you can observe automatic rollback.
    </p>
    <Suspense>
      <ApproachTabs />
      <template #fallback>
        <p>Loading todos…</p>
      </template>
    </Suspense>
  </main>
  <VueQueryDevtools />
</template>
