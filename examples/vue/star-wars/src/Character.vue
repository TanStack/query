<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import CharacterFilm from './CharacterFilm.vue'
import Homeworld from './Homeworld.vue'
import { charactersQueries } from './services/characters/queries'

const props = defineProps<{ characterId: string }>()

const { data, status } = useQuery(() =>
  charactersQueries.detail(props.characterId),
)

const getId = (url: string) => {
  const urlParts = url.split('/').filter(Boolean)
  return urlParts[urlParts.length - 1]
}

const homeworldId = computed(() =>
  data.value ? getId(data.value.homeworld) : undefined,
)
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">{{ data.name }}</h2>
    <p><strong>Born</strong>: {{ data.birth_year }}</p>
    <p><strong>Eyes</strong>: {{ data.eye_color }}</p>
    <p><strong>Hair</strong>: {{ data.hair_color }}</p>
    <p><strong>Height</strong>: {{ data.height }}</p>
    <p><strong>Mass</strong>: {{ data.mass }}</p>
    <p>
      <strong>Homeworld</strong>:
      <Homeworld v-if="homeworldId" :homeworldId="homeworldId" />
    </p>

    <h4 class="text-2xl pt-4">Films</h4>
    <CharacterFilm
      v-for="film in data.films"
      :key="getId(film)"
      :filmId="getId(film)"
    />
  </div>
</template>
