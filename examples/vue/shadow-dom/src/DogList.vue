<script setup lang="ts">
import {
  isPending as queryIsPending,
  isError as queryIsError,
  useQuery,
} from '@tanstack/vue-query'
import { computed } from 'vue'
import { dogsQueries } from './services/dogs/queries'

const { state: queryState, data } = useQuery(dogsQueries.list())
const isPending = computed(() => queryIsPending(queryState))
const isError = computed(() => queryIsError(queryState))
</script>

<template>
  <template v-if="isPending">Loading...</template>
  <template v-else-if="isError">Error!</template>
  <div v-else-if="data">
    <div v-for="dog in Object.keys(data.message)" :key="dog">{{ dog }}</div>
  </div>
</template>
