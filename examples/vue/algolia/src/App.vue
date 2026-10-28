<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

import Search from './Search.vue'
</script>

<template>
  <div class="App">
    <h1>TanStack Query with Algolia</h1>
    <Search />
  </div>
  <VueQueryDevtools initialIsOpen />
</template>
