<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <div style="padding: 16px">
    <RouterView />
  </div>
  <Toaster />
  <VueQueryDevtools initial-is-open />
</template>
