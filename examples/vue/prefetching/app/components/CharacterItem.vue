<script setup lang="ts">
import { noop, useQuery, useQueryClient } from '@tanstack/vue-query'
import { charactersQueries } from '../services/characters/queries'
import type { Character } from '../services/characters/types'

const props = defineProps<{ char: Character }>()
const emit = defineEmits<{ select: [id: number] }>()

const queryClient = useQueryClient()

const { data } = useQuery(() => ({
  ...charactersQueries.detail(props.char.id),
  enabled: false,
}))

const prefetch = () => {
  queryClient
    .query({
      ...charactersQueries.detail(props.char.id),
      staleTime: 10 * 1000, // only prefetch if older than 10 seconds
    })
    .catch(noop)
}
</script>

<template>
  <li @mouseenter="prefetch" @focus="prefetch">
    <button
      type="button"
      :style="data ? { fontWeight: 'bold' } : {}"
      @click="emit('select', char.id)"
    >
      {{ char.id }} - {{ char.name }}
    </button>
    {{ ' ' }}
    <NuxtLink :to="`/character/${char.id}`">details</NuxtLink>
  </li>
</template>
