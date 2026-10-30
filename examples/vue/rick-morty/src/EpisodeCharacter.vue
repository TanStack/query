<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { charactersQueries } from './services/characters/queries'

const props = defineProps<{ characterId: string }>()

const { data, status } = useQuery(() =>
  charactersQueries.detail(props.characterId),
)
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <article v-else-if="data">
    <RouterLink
      class="text-blue-500 hover:underline"
      :to="`/characters/${characterId}`"
    >
      <h6 class="text-lg">{{ data.name }}</h6>
    </RouterLink>
  </article>
</template>
