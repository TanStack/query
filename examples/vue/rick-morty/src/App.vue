<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import Layout from './Layout.vue'
</script>

<template>
  <Layout />
  <VueQueryDevtools initialIsOpen />
</template>
