<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { locationsQueries } from './services/locations/queries'

const props = defineProps<{ locationId: string }>()

const { data, status } = useQuery(() =>
  locationsQueries.detail(props.locationId),
)
</script>

<template>
  <span v-if="status === 'pending'">Loading...</span>
  <span v-else-if="status === 'error'">Error :(</span>
  <span v-else-if="data">{{ data.name }} - {{ data.type }}</span>
</template>
