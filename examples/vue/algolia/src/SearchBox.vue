<script setup lang="ts">
import { useDebouncedValue } from '@tanstack/vue-pacer/debouncer'
import { ref } from 'vue'
import SearchResults from './SearchResults.vue'

const query = ref('')
const [debouncedQuery] = useDebouncedValue(query, { wait: 300 })
</script>

<template>
  <div>
    <input v-model="query" placeholder="Search products" />
    <SearchResults :query="debouncedQuery" />
  </div>
</template>
