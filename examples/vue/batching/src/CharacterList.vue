<script setup lang="ts">
import { useQueries } from '@tanstack/vue-query'
import { charactersQueries } from './services/characters/queries'

const props = defineProps<{ ids: Array<number> }>()

const characters = useQueries({
  queries: () => props.ids.map((id) => charactersQueries.detail(id)),
})
</script>

<template>
  <template v-for="(character, index) in characters" :key="index">
    <template v-if="character.status === 'pending'">Loading...</template>
    <template v-else-if="character.status === 'error'">Error...</template>
    <template v-else-if="character.data === null">Not found ...</template>
    <div v-else style="display: flex">
      <img
        width="100"
        height="100"
        :alt="character.data.image"
        :src="character.data.image"
      />
      <div style="padding-left: 10px; text-align: left">
        <h5 style="margin-top: 0; margin-bottom: 5px">
          {{ character.data.name }} (#{{ character.data.id }})
        </h5>
        <p style="margin-top: 0; margin-bottom: 2px">
          Status: {{ character.data.status }}
        </p>
        <p style="margin-top: 0; margin-bottom: 2px">
          Species: {{ character.data.species }}
        </p>
        <p style="margin-top: 0; margin-bottom: 2px">
          Gender: {{ character.data.gender }}
        </p>
      </div>
    </div>
  </template>
</template>
