<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { filmsQueries } from './services/films/queries'

const { data, status } = useQuery(filmsQueries.list())

const getFilmId = (url: string) => {
  const filmUrlParts = url.split('/').filter(Boolean)
  return filmUrlParts[filmUrlParts.length - 1]
}
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">Films</h2>
    <article v-for="film in data.results" :key="getFilmId(film.url)">
      <RouterLink
        class="text-blue-500 hover:underline"
        :to="`/films/${getFilmId(film.url)}`"
      >
        <h6 class="text-xl">
          {{ film.episode_id }}. {{ film.title }}
          <em>({{ new Date(Date.parse(film.release_date)).getFullYear() }})</em>
        </h6>
      </RouterLink>
    </article>
  </div>
</template>
