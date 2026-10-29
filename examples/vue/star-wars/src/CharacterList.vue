<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { charactersQueries } from './services/characters/queries'

const { data, status } = useQuery(charactersQueries.list())

const getPersonId = (url: string) => {
  const personUrlParts = url.split('/').filter(Boolean)
  return personUrlParts[personUrlParts.length - 1]
}
</script>

<template>
  <p v-if="status === 'pending'">Loading...</p>
  <p v-else-if="status === 'error'">Error :(</p>
  <div v-else-if="data">
    <h2 class="text-4xl">Characters</h2>
    <article v-for="person in data.results" :key="getPersonId(person.url)">
      <RouterLink
        class="text-blue-500 hover:underline"
        :to="`/characters/${getPersonId(person.url)}`"
      >
        <h6 class="text-xl">{{ person.name }}</h6>
      </RouterLink>
    </article>
  </div>
</template>
