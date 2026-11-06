<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { planetsQueries } from './services/planets/queries'

const props = defineProps<{ homeworldId: string }>()

const { data, status } = useQuery(() =>
  planetsQueries.detail(props.homeworldId),
)
</script>

<template>
  <span v-if="status === 'pending'">Loading...</span>
  <span v-else-if="status === 'error'">Error :(</span>
  <span v-else-if="data">{{ data.name }}</span>
</template>
