<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { charactersQueries } from './services/characters/queries'

const props = defineProps<{ characterId: string }>()

const { data, status } = useQuery(() =>
  charactersQueries.detail(props.characterId),
)
</script>

<template>
  <RouterLink
    v-if="status === 'success' && data"
    class="text-blue-500 hover:underline"
    :to="`/characters/${characterId}`"
  >
    <h6 class="text-lg">{{ data.name }}</h6>
  </RouterLink>
</template>
