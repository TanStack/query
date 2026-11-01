<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <RouterView />
  <VueQueryDevtools button-position="bottom-right" />
</template>
