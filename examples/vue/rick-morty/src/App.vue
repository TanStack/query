<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import AppLayout from './AppLayout.vue'
</script>

<template>
  <AppLayout />
  <VueQueryDevtools initial-is-open />
</template>
