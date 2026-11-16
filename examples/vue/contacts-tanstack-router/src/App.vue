<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { RouterProvider } from '@tanstack/vue-router'
import { router } from './router'
</script>

<template>
  <RouterProvider :router="router" />
  <VueQueryDevtools button-position="bottom-right" />
</template>
