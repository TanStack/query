<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { episodesQueries } from './services/episodes/queries'

const { data, status } = useQuery(episodesQueries.list())
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">Episodes</h2>
    <article v-for="episode in data.results" :key="episode.id">
      <RouterLink
        class="text-blue-500 hover:underline"
        :to="`/episodes/${episode.id}`"
      >
        <h6 class="text-xl">
          {{ episode.episode }} - {{ episode.name }}
          <em>{{ episode.air_date }}</em>
        </h6>
      </RouterLink>
    </article>
  </div>
</template>
