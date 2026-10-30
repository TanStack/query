<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

import SearchBox from './SearchBox.vue'
</script>

<template>
  <div class="App">
    <h1>TanStack Query with Algolia</h1>
    <SearchBox />
  </div>
  <VueQueryDevtools initial-is-open />
</template>
