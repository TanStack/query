<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import CharacterEpisode from './CharacterEpisode.vue'
import Location from './Location.vue'
import { charactersQueries } from './services/characters/queries'

const props = defineProps<{ characterId: string }>()

const { data, status } = useQuery(() =>
  charactersQueries.detail(props.characterId),
)

const getId = (url: string) => {
  const urlParts = url.split('/').filter(Boolean)
  return urlParts[urlParts.length - 1]
}

const locationId = computed(() =>
  data.value ? getId(data.value.location.url) : undefined,
)
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">{{ data.name }}</h2>
    <p><strong>Gender</strong>: {{ data.gender }}</p>
    <p><strong>Status</strong>: {{ data.status }}</p>
    <p><strong>Species</strong>: {{ data.species }}</p>
    <p><strong>Origin</strong>: {{ data.origin.name }}</p>
    <p>
      <strong>Location</strong>:
      <Location v-if="locationId" :locationId="locationId" />
      <template v-else>{{ data.location.name }}</template>
    </p>

    <h4 class="text-2xl pt-4">Episodes</h4>
    <CharacterEpisode
      v-for="episode in data.episode"
      :key="getId(episode)"
      :episodeId="getId(episode)"
    />
  </div>
</template>
