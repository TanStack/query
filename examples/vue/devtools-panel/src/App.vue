<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'
import { reposQueries } from './services/repos/queries'

const isOpen = ref(false)

const { isPending, error, data, isFetching } = useQuery(reposQueries.detail())
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
  <VueQueryDevtoolsPanel v-if="isOpen" :onClose="() => (isOpen = false)" />
</template>
