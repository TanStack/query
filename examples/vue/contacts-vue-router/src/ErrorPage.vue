<script setup lang="ts">
import { watchEffect } from 'vue'

const props = defineProps<{ error: unknown }>()

watchEffect(() => console.error(props.error))
</script>

<template>
  <div id="error-page">
    <h1>Oops!</h1>
    <p>Sorry, an unexpected error has occurred.</p>
    <p>
      <i>{{ error instanceof Error ? error.message : '' }}</i>
    </p>
  </div>
</template>
