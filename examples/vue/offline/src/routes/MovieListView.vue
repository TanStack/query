<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { moviesQueries } from '../services/movies/queries'

const { data, error, isError, isFetching, isLoading } = useQuery(
  moviesQueries.list(),
)
</script>

<template>
  <template v-if="isLoading">Loading...</template>
  <div v-else-if="data">
    <h1>Movies</h1>
    <p>
      Try to mock offline behavior with the button in the devtools. You can
      navigate around as long as there is already data in the cache. You'll get
      a refetch as soon as you go online again.
    </p>
    <ul>
      <li v-for="movie in data.movies" :key="movie.id">
        <RouterLink :to="`/${movie.id}`">{{ movie.title }}</RouterLink>
      </li>
    </ul>
    <div>Updated at: {{ new Date(data.ts).toLocaleTimeString() }}</div>
    <div>{{ isFetching ? 'fetching...' : '' }}</div>
  </div>
  <div v-else-if="isError">
    <h1>Couldn't load movies!</h1>
    <div>{{ error?.message }}</div>
  </div>
</template>
