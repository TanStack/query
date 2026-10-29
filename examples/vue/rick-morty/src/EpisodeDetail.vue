<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import EpisodeCharacter from './EpisodeCharacter.vue'
import { episodesQueries } from './services/episodes/queries'

const props = defineProps<{ episodeId: string }>()

const { data, status } = useQuery(() => episodesQueries.detail(props.episodeId))

const getCharacterId = (url: string) => {
  const characterUrlParts = url.split('/').filter(Boolean)
  return characterUrlParts[characterUrlParts.length - 1]
}
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">{{ data.name }}</h2>
    <p>{{ data.air_date }}</p>
    <br />
    <h4 class="text-2xl">Characters</h4>
    <EpisodeCharacter
      v-for="character in data.characters"
      :key="getCharacterId(character)"
      :character-id="getCharacterId(character)"
    />
  </div>
</template>
