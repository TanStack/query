<script setup lang="ts">
import {
  isPending as queryIsPending,
  isFetching as queryIsFetching,
  useQuery,
} from '@tanstack/vue-query'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'
import { computed, ref } from 'vue'
import { reposQueries } from './services/repos/queries'

const isOpen = ref(false)

const { state: queryState, error, data } = useQuery(reposQueries.detail())
const isPending = computed(() => queryIsPending(queryState))
const isFetching = computed(() => queryIsFetching(queryState))
</script>

<template>
  <div v-if="isPending">Loading...</div>
  <div v-else-if="error">An error has occurred: {{ error.message }}</div>
  <div v-else-if="data" :style="{ paddingBottom: '20px' }">
    <h1>{{ data.full_name }}</h1>
    <p>{{ data.description }}</p>
    <strong>👀 {{ data.subscribers_count }}</strong>
    {{ ' ' }}
    <strong>✨ {{ data.stargazers_count }}</strong>
    {{ ' ' }}
    <strong>🍴 {{ data.forks_count }}</strong>
    <div>{{ isFetching ? 'Updating...' : '' }}</div>
  </div>
  <button type="button" @click="isOpen = !isOpen">
    {{ isOpen ? 'Close' : 'Open' }} the devtools panel
  </button>
  <VueQueryDevtoolsPanel v-if="isOpen" :on-close="() => (isOpen = false)" />
</template>
