<script setup lang="ts">
import {
  isError as queryIsError,
  isPending as queryIsPending,
  useQuery,
} from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { computed, ref } from 'vue'
import CharacterItem from '../components/CharacterItem.vue'
import { charactersQueries } from '../services/characters/queries'

const selectedChar = ref(1)

const {
  state: queryState,
  data: characters,
  error: charactersError,
} = useQuery(charactersQueries.list())
const isCharactersError = computed(() => queryIsError(queryState))
const isCharactersPending = computed(() => queryIsPending(queryState))

const {
  state: detailState,
  data: character,
  error: characterError,
} = useQuery(() => charactersQueries.detail(selectedChar.value))
const isCharacterError = computed(() => queryIsError(detailState))
const isCharacterPending = computed(() => queryIsPending(detailState))
</script>

<template>
  <div class="App">
    <p>
      Hovering over a character will prefetch it, and when it's been prefetched
      it will turn <strong>bold</strong>. Clicking on a prefetched character
      will show their stats below immediately, and opening its details page will
      render it without a loading state.
    </p>
    <h2>Characters</h2>
    <template v-if="isCharactersPending">Loading...</template>
    <span v-else-if="isCharactersError">
      Error: {{ charactersError?.message }}
    </span>
    <template v-else>
      <ul>
        <CharacterItem
          v-for="char in characters?.results"
          :key="char.id"
          :char="char"
          @select="selectedChar = $event"
        />
      </ul>

      <h3>Selected Character</h3>
      <template v-if="isCharacterPending">Loading...</template>
      <span v-else-if="isCharacterError">
        Error: {{ characterError?.message }}
      </span>
      <pre v-else>{{ JSON.stringify(character, null, 2) }}</pre>
      <VueQueryDevtools initial-is-open />
    </template>
  </div>
</template>
