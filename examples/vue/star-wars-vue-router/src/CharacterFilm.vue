<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { filmsQueries } from './services/films/queries'

const props = defineProps<{ filmId: string }>()

const { data, status } = useQuery(() => filmsQueries.detail(props.filmId))
</script>

<template>
  <RouterLink
    v-if="status === 'success' && data"
    class="text-blue-500 hover:underline"
    :to="`/films/${filmId}`"
  >
    <h6 class="text-lg">{{ data.episode_id }}. {{ data.title }}</h6>
  </RouterLink>
</template>
