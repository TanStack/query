<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import FilmCharacter from './FilmCharacter.vue'
import { filmsQueries } from './services/films/queries'

const props = defineProps<{ filmId: string }>()

const { data, status } = useQuery(() => filmsQueries.detail(props.filmId))

const getCharacterId = (url: string) => {
  const characterUrlParts = url.split('/').filter(Boolean)
  return characterUrlParts[characterUrlParts.length - 1]
}
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">{{ data.title }}</h2>
    <p>{{ data.opening_crawl }}</p>
    <br />
    <h4 class="text-2xl">Characters</h4>
    <FilmCharacter
      v-for="character in data.characters"
      :key="getCharacterId(character)"
      :character-id="getCharacterId(character)"
    />
  </div>
</template>
