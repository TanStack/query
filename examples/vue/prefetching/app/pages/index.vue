<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import CharacterItem from '../components/CharacterItem.vue'
import { charactersQueries } from '../services/characters/queries'

const selectedChar = ref(1)

const {
  data: characters,
  error: charactersError,
  isError: isCharactersError,
  isPending: isCharactersPending,
} = useQuery(charactersQueries.list())

const {
  data: character,
  error: characterError,
  isError: isCharacterError,
  isPending: isCharacterPending,
} = useQuery(() => charactersQueries.detail(selectedChar.value))
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
      <VueQueryDevtools initialIsOpen />
    </template>
  </div>
</template>
