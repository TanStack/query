<script setup lang="ts">
import { ref } from 'vue'

import SearchResults from './SearchResults.vue'

const query = ref('')
</script>

<template>
  <div>
    <!-- It is recommended to debounce this event in prod -->
    <input v-model="query" placeholder="Search products" />
    <SearchResults :query="query" />
  </div>
</template>
