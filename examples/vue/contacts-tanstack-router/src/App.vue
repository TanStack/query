<script setup lang="ts">
import { RouterProvider } from '@tanstack/vue-router'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { router } from './router'
</script>

<template>
  <RouterProvider :router="router" />
  <VueQueryDevtools button-position="bottom-right" />
</template>
