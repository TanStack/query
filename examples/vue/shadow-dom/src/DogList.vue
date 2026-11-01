<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { dogsQueries } from './services/dogs/queries'

const { isPending, isError, data } = useQuery(dogsQueries.list())
</script>

<template>
  <template v-if="isPending">Loading...</template>
  <template v-else-if="isError">Error!</template>
  <div v-else-if="data">
    <div v-for="dog in Object.keys(data.message)" :key="dog">{{ dog }}</div>
  </div>
</template>
