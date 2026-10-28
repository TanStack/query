<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <RouterView />
  <VueQueryDevtools buttonPosition="bottom-right" />
</template>
