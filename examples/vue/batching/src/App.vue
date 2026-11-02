<script setup lang="ts">
import { ref } from 'vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import CharacterList from './CharacterList.vue'

const ids = ref<Array<number>>([])
const idsToLoad = ref<Array<number>>([])
const error = ref('')

const handleInput = (event: Event) => {
  const parsedIds = (event.target as HTMLInputElement).value
    .split(',')
    .map((id) => id.trim())

  if (parsedIds.every((id) => /^\d+$/.test(id))) {
    ids.value = parsedIds.map(Number)
    error.value = ''
  } else {
    error.value = 'Invalid.. only use numbers and comma'
  }
}
</script>

<template>
  <div class="App">
    <h2>Character fetcher</h2>
    <div>
      <label for="ids" style="display: block">
        Character ids (numeric, comma separated)
      </label>
      <input
        id="ids"
        style="display: inline-block"
        placeholder="ids"
        @input="handleInput"
      />
    </div>

    <h3 v-if="error" style="color: red">{{ error }}</h3>

    <button type="button" :disabled="!!error" @click="idsToLoad = ids">
      Load characters
    </button>
    <div>
      <h4 style="text-align: left">Characters:</h4>
      <CharacterList :ids="idsToLoad" />
    </div>
  </div>
  <VueQueryDevtools initial-is-open />
</template>
