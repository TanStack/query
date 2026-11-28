<script setup lang="ts">
import { isFetching as queryIsFetching, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { charactersQueries } from '../../services/characters/queries'

const route = useRoute()
const isValidId = computed(
  () =>
    typeof route.params.id === 'string' &&
    /^\d+$/.test(route.params.id) &&
    Number(route.params.id) > 0,
)

const {
  state: queryState,
  status,
  data,
  error,
} = useQuery(() =>
  charactersQueries.detail(
    isValidId.value ? Number(route.params.id) : undefined,
  ),
)
const isFetching = computed(() => queryIsFetching(queryState))
</script>

<template>
  <div style="text-align: center">
    <template v-if="!isValidId">Invalid character ID</template>
    <template v-else-if="status === 'pending'">Loading...</template>
    <span v-else-if="status === 'error'">Error: {{ error?.message }}</span>
    <template v-else-if="data">
      <h1>{{ data.name }}</h1>
      <div>
        <p>status: {{ data.status }}</p>
        <p>species: {{ data.species }}</p>
        <p>gender: {{ data.gender }}</p>
        <p>origin: {{ data.origin.name }}</p>
      </div>
      <div>{{ isFetching ? 'Background Updating...' : ' ' }}</div>
    </template>
    <br />
    <br />
    <NuxtLink to="/">Back</NuxtLink>
  </div>
</template>
