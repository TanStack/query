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
    :initialIsOpen="false"
    buttonPosition="bottom-left"
    :shadowDOMTarget="shadowRoot"
  />
</template>
