<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

import DogList from './DogList.vue'

defineProps<{ shadowRoot: ShadowRoot }>()
</script>

<template>
  <div :style="{ padding: '30px' }">
    <h2>Dog Breeds</h2>
    <DogList />
  </div>
  <VueQueryDevtools
    :initial-is-open="false"
    button-position="bottom-left"
    :shadow-d-o-m-target="shadowRoot"
  />
</template>
