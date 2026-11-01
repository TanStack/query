<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { episodesQueries } from './services/episodes/queries'

const props = defineProps<{ episodeId: string }>()

const { data, status } = useQuery(() => episodesQueries.detail(props.episodeId))
</script>

<template>
  <article v-if="status === 'success' && data">
    <RouterLink
      class="text-blue-500 hover:underline"
      :to="`/episodes/${episodeId}`"
    >
      <h6 class="text-lg">
        {{ data.episode }}. {{ data.name }} - {{ data.air_date }}
      </h6>
    </RouterLink>
  </article>
</template>
