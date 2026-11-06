<script setup lang="ts">
import { RouterProvider } from '@tanstack/vue-router'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { Toaster } from 'vue-sonner'
import { router } from './router'
</script>

<template>
  <div style="padding: 16px">
    <RouterProvider :router="router" />
  </div>
  <Toaster />
  <VueQueryDevtools initial-is-open />
</template>
